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
 * Registra a comissão de gerente de uma transação concluída (permuta/negociada),
 * avaliando os dois lados — comprador E vendedor — independentemente. Antes só
 * olhava o lado comprador (contaOrigem), então um gerente nunca ganhava comissão
 * quando o associado dele era quem vendia.
 *
 * Regra (decisão de produto de 2026-09-18): comissão só é gerada quando
 * Associado.tipoOperacao cobre o lado em que ele participou nessa transação
 * (`compra` só comissiona compra, `venda` só venda, `compra_venda` comissiona
 * os dois lados mas com METADE do percentual em cada um — 10% vira 5%+5%).
 * Sem tipoOperacao configurado, ou percentual do gerente em 0%, não gera nada.
 * Sempre em BRL (comissaoBRL) — nunca RT.
 */
export async function registrarComissaoGerentePorTransacao(transacaoId: string) {
  const transacao = await prisma.transacao.findUnique({ where: { id: transacaoId } })
  if (!transacao) return

  const lados: Array<{ associadoId: string | null; operacao: 'compra' | 'venda' }> = [
    { associadoId: transacao.compradorId, operacao: 'compra' },
    { associadoId: transacao.vendedorId, operacao: 'venda' },
  ]

  for (const lado of lados) {
    if (!lado.associadoId) continue
    await registrarComissaoDoLado(transacao.id, Number(transacao.valorRT), lado.associadoId, lado.operacao)
  }
}

async function registrarComissaoDoLado(
  transacaoId: string,
  valorRT: number,
  associadoId: string,
  operacao: 'compra' | 'venda',
) {
  const associado = await prisma.associado.findUnique({
    where: { id: associadoId },
    include: { gerente: true },
  })
  if (!associado?.gerenteId || !associado.gerente) return
  if (!associado.tipoOperacao) return

  const cobreEsseLado = associado.tipoOperacao === operacao || associado.tipoOperacao === 'compra_venda'
  if (!cobreEsseLado) return

  const percentualBase = Number(associado.gerente.percentualComissao ?? 0)
  if (percentualBase <= 0) return

  // compra_venda divide o percentual do gerente meio a meio entre os dois
  // lados — o gerente ganha o percentual cheio no total, não em dobro.
  const percentualAplicado = associado.tipoOperacao === 'compra_venda' ? percentualBase / 2 : percentualBase
  const comissaoBRL = valorRT * (percentualAplicado / 100)
  if (comissaoBRL <= 0) return

  await prisma.comissaoGerente.create({
    data: {
      gerenteId: associado.gerente.id,
      associadoId: associado.id,
      transacaoId,
      tipoComissao: 'transacao',
      baseValorRT: valorRT,
      percentual: percentualAplicado,
      comissaoBRL,
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

  const grupos = await prisma.comissaoGerente.groupBy({
    by: ['gerenteId'],
    where: { criadoEm: { gte: inicioMesAnterior, lt: inicioMesAtual } },
    _sum: { comissaoBRL: true },
  })
  if (grupos.length === 0) return { criadas: 0, competencia: inicioMesAnterior }

  let criadas = 0
  for (const grupo of grupos) {
    const valor = Number(grupo._sum.comissaoBRL ?? 0)
    if (valor <= 0) continue

    try {
      await prisma.pagamentoGerente.create({
        data: { gerenteId: grupo.gerenteId, competencia: inicioMesAnterior, valorBRL: valor },
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
