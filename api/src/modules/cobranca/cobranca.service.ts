import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { getLimiteCreditoDaConta, saldoSuficienteParaDebito } from '../../shared/utils/limites.js'
import { proximoVencimentoManutencao } from '../../shared/utils/data.js'
import type { CriarCobrancaInput, ListCobrancaQueryType } from './cobranca.schema.js'

interface EntidadeComPlano {
  id: string
  nome: string
  status: string
  criadoEm: Date
  diaVencimentoFatura: number | null
  plano: { nome: string; taxaManutencaoAnual: unknown } | null
  conta: { id: string; numero: string } | null
}

function montarItemManutencao(
  entidade: EntidadeComPlano,
  tipo: 'associado' | 'agencia',
  ultimaPorConta: Map<string, { id: string; vencimento: Date; pago: boolean }>,
) {
  if (!entidade.conta || !entidade.plano) return null

  const ultima = ultimaPorConta.get(entidade.conta.id)
  const proximoVencimento = proximoVencimentoManutencao(
    entidade.criadoEm,
    entidade.diaVencimentoFatura ?? 10,
    ultima,
  )
  const emAberto = !!ultima && !ultima.pago
  const hoje = new Date()
  const diasAtraso =
    emAberto && proximoVencimento < hoje
      ? Math.floor((hoje.getTime() - proximoVencimento.getTime()) / (1000 * 60 * 60 * 24))
      : 0

  return {
    tipo,
    id: entidade.id,
    nome: entidade.nome,
    status: entidade.status,
    plano: entidade.plano.nome,
    valorManutencao: entidade.plano.taxaManutencaoAnual,
    contaId: entidade.conta.id,
    contaNumero: entidade.conta.numero,
    ultimaCobrancaId: ultima?.id ?? null,
    ultimaCobrancaPaga: ultima?.pago ?? null,
    proximoVencimento,
    emAberto,
    diasAtraso,
  }
}

export async function relatorioManutencaoAnual() {
  const [associados, agencias] = await Promise.all([
    prisma.associado.findMany({
      where: { status: { not: 'inativo' }, plano: { taxaManutencaoAnual: { gt: 0 } } },
      select: {
        id: true,
        nome: true,
        status: true,
        criadoEm: true,
        diaVencimentoFatura: true,
        plano: { select: { nome: true, taxaManutencaoAnual: true } },
        conta: { select: { id: true, numero: true } },
      },
    }),
    prisma.agencia.findMany({
      where: { status: { not: 'inativo' }, plano: { taxaManutencaoAnual: { gt: 0 } } },
      select: {
        id: true,
        nome: true,
        status: true,
        criadoEm: true,
        diaVencimentoFatura: true,
        plano: { select: { nome: true, taxaManutencaoAnual: true } },
        conta: { select: { id: true, numero: true } },
      },
    }),
  ])

  const contaIds = [...associados, ...agencias]
    .map((e) => e.conta?.id)
    .filter((id): id is string => !!id)

  const ultimasCobrancas = await prisma.cobranca.findMany({
    where: { contaId: { in: contaIds }, tipo: 'manutencao' },
    orderBy: { vencimento: 'desc' },
    select: { id: true, contaId: true, vencimento: true, pago: true },
  })
  const ultimaPorConta = new Map<string, { id: string; vencimento: Date; pago: boolean }>()
  for (const c of ultimasCobrancas) {
    // orderBy vencimento desc — a primeira ocorrência por contaId já é a mais recente.
    if (!ultimaPorConta.has(c.contaId)) ultimaPorConta.set(c.contaId, c)
  }

  const items = [
    ...associados.map((a) => montarItemManutencao(a, 'associado', ultimaPorConta)),
    ...agencias.map((a) => montarItemManutencao(a, 'agencia', ultimaPorConta)),
  ].filter((i): i is NonNullable<typeof i> => i !== null)

  items.sort((a, b) => a.proximoVencimento.getTime() - b.proximoVencimento.getTime())

  return { items }
}

const include = {
  conta: { select: { numero: true } },
  associado: { select: { nome: true } },
  agencia: { select: { nome: true } },
}

export async function criarCobranca(input: CriarCobrancaInput) {
  return prisma.cobranca.create({ data: { ...input, vencimento: new Date(input.vencimento) }, include })
}

export async function listarCobrancasPorConta(contaId: string, query: ListCobrancaQueryType) {
  const { page, limit, pago } = query
  const where = { contaId, ...(pago !== undefined ? { pago } : {}) }
  const [items, total] = await prisma.$transaction([
    prisma.cobranca.findMany({
      where,
      orderBy: { vencimento: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
    prisma.cobranca.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarCobrancasPorAssociado(associadoId: string, query: ListCobrancaQueryType) {
  const { page, limit, pago } = query
  const where = { associadoId, ...(pago !== undefined ? { pago } : {}) }
  const [items, total] = await prisma.$transaction([
    prisma.cobranca.findMany({
      where,
      orderBy: { vencimento: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
    prisma.cobranca.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarCobrancasPorAgencia(agenciaId: string, query: ListCobrancaQueryType) {
  // Cobranças diretas da agência + cobranças dos seus associados
  const associados = await prisma.associado.findMany({ where: { agenciaId }, select: { id: true } })
  const assocIds = associados.map((a) => a.id)
  const { page, limit, pago } = query
  const where = {
    OR: [{ agenciaId }, { associadoId: { in: assocIds } }],
    ...(pago !== undefined ? { pago } : {}),
  }
  const [items, total] = await prisma.$transaction([
    prisma.cobranca.findMany({
      where,
      orderBy: { vencimento: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
    prisma.cobranca.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarTodasCobrancas(query: ListCobrancaQueryType) {
  const { page, limit, pago } = query
  const where = pago !== undefined ? { pago } : {}
  const [items, total] = await prisma.$transaction([
    prisma.cobranca.findMany({
      where,
      orderBy: { vencimento: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
    prisma.cobranca.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function quitarCobranca(id: string) {
  const cobranca = await prisma.cobranca.findUnique({ where: { id }, include: { agencia: { include: { conta: true } } } })
  if (!cobranca) throw Errors.notFound('Cobrança')
  if (cobranca.pago) throw new AppError('VALIDATION_ERROR', 'Cobrança já quitada.', 422)

  // Cobrança em BRL é liquidada fora do sistema (PIX/boleto) — "quitar" só reconcilia manualmente.
  // Cobrança em RT é liquidada DENTRO do sistema — "quitar" precisa mover o RT de verdade,
  // senão a dívida nunca é paga de fato (só fica marcada como paga).
  if (cobranca.valorRT) {
    const contaDevedora = await prisma.conta.findUniqueOrThrow({ where: { id: cobranca.contaId } })
    const valor = Number(cobranca.valorRT)
    const limiteCredito = await getLimiteCreditoDaConta(contaDevedora.id)
    if (!saldoSuficienteParaDebito(Number(contaDevedora.saldo), valor, limiteCredito)) {
      throw Errors.insufficientBalance()
    }

    const contaCredora = cobranca.agencia?.conta ?? null

    await prisma.$transaction(async (tx) => {
      await tx.movimentacaoConta.create({
        data: {
          contaId: contaDevedora.id,
          tipo: 'debito',
          valor,
          saldoApos: Number(contaDevedora.saldo) - valor,
          descricao: cobranca.descricao ?? `Cobrança RT quitada #${id.slice(0, 8)}`,
        },
      })
      await tx.conta.update({ where: { id: contaDevedora.id }, data: { saldo: { decrement: valor } } })

      // Se a cobrança tem uma agência associada, o RT vai para ela (ex: taxa de inscrição
      // recolhida pela agência que cadastrou o associado). Sem agência, o RT é retirado de
      // circulação — simétrico à injeção de RT pela Matriz, que credita sem debitar origem.
      if (contaCredora) {
        await tx.movimentacaoConta.create({
          data: {
            contaId: contaCredora.id,
            tipo: 'credito',
            valor,
            saldoApos: Number(contaCredora.saldo) + valor,
            descricao: cobranca.descricao ?? `Cobrança RT quitada #${id.slice(0, 8)}`,
          },
        })
        await tx.conta.update({ where: { id: contaCredora.id }, data: { saldo: { increment: valor } } })
      }

      await tx.cobranca.update({ where: { id }, data: { pago: true } })
    })

    return prisma.cobranca.findUnique({ where: { id }, include })
  }

  return prisma.cobranca.update({ where: { id }, data: { pago: true }, include })
}

export async function deletarCobranca(id: string) {
  const cobranca = await prisma.cobranca.findUnique({ where: { id } })
  if (!cobranca) throw Errors.notFound('Cobrança')
  await prisma.cobranca.delete({ where: { id } })
}
