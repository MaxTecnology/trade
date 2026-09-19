import { Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { gerarNumeroConta } from '../../shared/utils/conta.js'
import { inicioMesBrasilia } from '../../shared/utils/limites.js'
import type { CreateManagerInput, UpdateManagerInput } from './manager.schema.js'

const managerSelect = {
  id: true,
  nome: true,
  email: true,
  role: true,
  ativo: true,
  percentualComissao: true,
  entityType: true,
  agenciaId: true,
  associadoId: true,
  criadoEm: true,
  associado: {
    select: {
      id: true,
      nome: true,
      cnpj: true,
      telefone: true,
      status: true,
      cidade: true,
      estado: true,
      cep: true,
      logradouro: true,
      planoId: true,
      plano: { select: { id: true, nome: true, percentualComissao: true } },
      agencia: { select: { id: true, nome: true } },
      conta: { select: { id: true, numero: true, saldo: true } },
    },
  },
}

export async function create(input: CreateManagerInput) {
  const [cnpjExists, emailAssociado, emailUsuario, plano] = await Promise.all([
    prisma.associado.findUnique({ where: { cnpj: input.cnpj } }),
    prisma.associado.findUnique({ where: { email: input.email } }),
    prisma.usuario.findUnique({ where: { email: input.email } }),
    prisma.plano.findUnique({ where: { id: input.planoId } }),
  ])

  if (cnpjExists) throw Errors.duplicateCnpj()
  if (emailAssociado || emailUsuario) throw Errors.duplicateEmail()
  if (!plano || !plano.ativo) throw Errors.planoInativo()
  if (plano.tipoPlano !== 'gerente') throw Errors.planoInativo()

  if (input.agenciaId) {
    const agencia = await prisma.agencia.findUnique({ where: { id: input.agenciaId } })
    if (!agencia) throw Errors.notFound('Agência')
  }

  return prisma.$transaction(async (tx) => {
    const associado = await tx.associado.create({
      data: {
        nome: input.nome,
        cnpj: input.cnpj,
        email: input.email,
        telefone: input.telefone,
        agenciaId: input.agenciaId ?? null,
        planoId: input.planoId,
        gerenteId: null,
        tipoAtendimento: [],
        logradouro: input.logradouro,
        cidade: input.cidade,
        estado: input.estado,
        cep: input.cep,
      },
    })

    const numero = await gerarNumeroConta()
    await tx.conta.create({
      data: { numero, entityType: 'associado', associadoId: associado.id },
    })

    const senhaHash = await bcrypt.hash(input.senha, env.BCRYPT_SALT_ROUNDS)
    const usuario = await tx.usuario.create({
      data: {
        nome: input.nome,
        email: input.email,
        senhaHash,
        role: 'gerente',
        entityType: 'associado',
        agenciaId: input.agenciaId ?? null,
        associadoId: associado.id,
        percentualComissao: plano.percentualComissao,
      },
      select: managerSelect,
    })

    return usuario
  })
}

export async function list(requester: { role: string; entityId: string }) {
  const where =
    requester.role === 'agency_admin'
      ? { role: 'gerente' as const, agenciaId: requester.entityId }
      : { role: 'gerente' as const }

  return prisma.usuario.findMany({
    where,
    select: managerSelect,
    orderBy: { criadoEm: 'desc' },
  })
}

export async function getById(id: string) {
  const gerente = await prisma.usuario.findFirst({
    where: { id, role: 'gerente' },
    select: managerSelect,
  })
  if (!gerente) throw Errors.notFound('Gerente')
  return gerente
}

export async function update(id: string, input: UpdateManagerInput) {
  const gerente = await getById(id)

  return prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.update({
      where: { id },
      data: {
        ...(input.nome ? { nome: input.nome } : {}),
        ...(input.email ? { email: input.email } : {}),
      },
      select: managerSelect,
    })

    if (input.nome || input.telefone) {
      await tx.associado.update({
        where: { id: gerente.associadoId! },
        data: {
          ...(input.nome ? { nome: input.nome } : {}),
          ...(input.telefone ? { telefone: input.telefone } : {}),
        },
      })
    }

    return usuario
  })
}

export async function setStatus(id: string, ativo: boolean) {
  await getById(id)
  return prisma.usuario.update({
    where: { id },
    data: { ativo },
    select: { id: true, nome: true, ativo: true },
  })
}

export async function getAssociados(id: string, page = 1, limit = 20) {
  await getById(id)
  const skip = (page - 1) * limit
  const [items, total] = await prisma.$transaction([
    prisma.associado.findMany({
      where: { gerenteId: id },
      skip,
      take: limit,
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.associado.count({ where: { gerenteId: id } }),
  ])
  return { items, total }
}

export async function getComissoes(id: string, page = 1, limit = 20) {
  await getById(id)
  const skip = (page - 1) * limit
  const [items, total, aggregate] = await prisma.$transaction([
    prisma.comissaoGerente.findMany({
      where: { gerenteId: id },
      skip,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: {
        transacao: { select: { id: true, tipo: true, valorRT: true, criadoEm: true } },
      },
    }),
    prisma.comissaoGerente.count({ where: { gerenteId: id } }),
    prisma.comissaoGerente.aggregate({
      where: { gerenteId: id },
      _sum: { comissaoBRL: true },
    }),
  ])

  return {
    items,
    total,
    totalComissaoBRL: aggregate._sum.comissaoBRL ?? 0,
  }
}

// ─────────────────────────────────────────
// COMISSÃO DE GERENTE POR TRANSAÇÃO
// ─────────────────────────────────────────

/**
 * Registra a comissão de gerente de uma transação concluída, DERIVADA das
 * linhas de ComissaoPlataforma já criadas pra ela (decisão de produto de
 * 2026-09-18: a comissão do gerente é um percentual em cima da comissão da
 * Agência/Matriz que o cadastrou, não mais um percentual direto sobre o
 * valor da transação). O split de `compra_venda` já aconteceu na comissão
 * da plataforma (percentual do plano pela metade); aqui o percentual do
 * GERENTE é aplicado sempre cheio, sem dividir de novo — evita contar a
 * divisão duas vezes.
 *
 * Chamado pelo worker `commission.gerente` (ver queues/bullmq.ts), depois
 * que `registrarComissoesPlataforma` (transaction.service.ts) já criou as
 * linhas de ComissaoPlataforma daquela transação, dentro da mesma $transaction
 * do débito/crédito — a leitura aqui vê sempre dados já commitados.
 */
export async function registrarComissoesGerenteDaTransacao(transacaoId: string) {
  const comissoesPlataforma = await prisma.comissaoPlataforma.findMany({
    where: { transacaoId, status: 'ativa', associadoId: { not: null } },
  })

  for (const comissao of comissoesPlataforma) {
    await registrarComissaoGerenteDeLinha(comissao)
  }
}

async function registrarComissaoGerenteDeLinha(comissao: {
  transacaoId: string
  associadoId: string | null
  comissaoBRL: Prisma.Decimal
}) {
  if (!comissao.associadoId) return
  const associado = await prisma.associado.findUnique({
    where: { id: comissao.associadoId },
    include: { gerente: true },
  })
  if (!associado?.gerenteId || !associado.gerente) return

  const percentualGerente = Number(associado.gerente.percentualComissao ?? 0)
  if (percentualGerente <= 0) return

  const baseBRL = Number(comissao.comissaoBRL)
  const comissaoGerenteBRL = baseBRL * (percentualGerente / 100)
  if (comissaoGerenteBRL <= 0) return

  await prisma.comissaoGerente.create({
    data: {
      gerenteId: associado.gerente.id,
      associadoId: associado.id,
      transacaoId: comissao.transacaoId,
      tipoComissao: 'transacao',
      baseValorRT: baseBRL,
      percentual: percentualGerente,
      comissaoBRL: comissaoGerenteBRL,
    },
  })
}

/**
 * Consolida a comissão de gerente (ComissaoGerente.comissaoBRL) do mês anterior
 * numa única PagamentoGerente por gerente — mesmo padrão de
 * gerarCobrancasComissaoMensal (cobranca.service.ts), rodando no mesmo job
 * mensal (commission.consolidate, ver queues/bullmq.ts). "Dar baixa" aqui é só
 * uma flag (pago sempre por fora do sistema, PIX/dinheiro) — nunca move saldo
 * de conta, diferente de quitarCobranca.
 */
export async function gerarPagamentosGerenteMensal(referencia: Date = new Date()) {
  const inicioMesAtual = inicioMesBrasilia(referencia)
  const inicioMesAnterior = inicioMesBrasilia(new Date(inicioMesAtual.getTime() - 1))

  const linhas = await prisma.comissaoGerente.findMany({
    where: {
      status: 'ativa',
      pagamentoGerenteId: null,
      criadoEm: { gte: inicioMesAnterior, lt: inicioMesAtual },
    },
  })
  if (linhas.length === 0) return { criadas: 0, competencia: inicioMesAnterior }

  const porGerente = new Map<string, typeof linhas>()
  for (const linha of linhas) {
    const lista = porGerente.get(linha.gerenteId) ?? []
    lista.push(linha)
    porGerente.set(linha.gerenteId, lista)
  }

  let criadas = 0
  for (const [gerenteId, linhasDoGerente] of porGerente) {
    const valor = linhasDoGerente.reduce((soma, l) => soma + Number(l.comissaoBRL), 0)
    if (valor <= 0) continue

    try {
      const pagamento = await prisma.pagamentoGerente.create({
        data: { gerenteId, competencia: inicioMesAnterior, valorBRL: valor },
      })
      await prisma.comissaoGerente.updateMany({
        where: { id: { in: linhasDoGerente.map((l) => l.id) } },
        data: { pagamentoGerenteId: pagamento.id },
      })
      criadas++
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue
      throw error
    }
  }

  return { criadas, competencia: inicioMesAnterior }
}

export async function listarPagamentosGerente(
  requester: { role: string; entityId: string },
  page = 1,
  limit = 20,
) {
  // agency_admin vê só pagamentos dos gerentes vinculados à própria agência
  // (mesmo filtro já usado em list() pra listagem de gerentes).
  const where =
    requester.role === 'agency_admin' ? { gerente: { agenciaId: requester.entityId } } : {}

  const [items, total] = await prisma.$transaction([
    prisma.pagamentoGerente.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { competencia: 'desc' },
      include: { gerente: { select: { nome: true, email: true } } },
    }),
    prisma.pagamentoGerente.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function quitarPagamentoGerente(id: string) {
  const pagamento = await prisma.pagamentoGerente.findUnique({ where: { id } })
  if (!pagamento) throw Errors.notFound('Pagamento de gerente')
  if (pagamento.pago) throw new AppError('VALIDATION_ERROR', 'Pagamento já quitado.', 422)
  return prisma.pagamentoGerente.update({
    where: { id },
    data: { pago: true, pagoEm: new Date() },
    include: { gerente: { select: { nome: true, email: true } } },
  })
}
