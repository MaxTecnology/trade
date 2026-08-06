import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import * as transactionService from '../transaction/transaction.service.js'
import type { SolicitarEstornoInput, ListEstornoQueryType } from './estorno.schema.js'

const include = {
  solicitante: { select: { id: true, nome: true } },
  transacao: {
    select: {
      id: true,
      tipo: true,
      status: true,
      valorRT: true,
      criadoEm: true,
      comprador: { select: { nome: true, agenciaId: true } },
      vendedor: { select: { nome: true, agenciaId: true } },
    },
  },
} as const

export async function solicitarEstorno(
  requester: { id: string; role: string; entityId: string },
  input: SolicitarEstornoInput,
) {
  const transacao = await prisma.transacao.findUnique({ where: { id: input.transacaoId } })
  if (!transacao) throw Errors.notFound('Transação')
  if (!['permuta', 'negociada'].includes(transacao.tipo)) {
    throw new AppError('VALIDATION_ERROR', 'Apenas permutas ou negociações podem ter estorno solicitado.', 422)
  }
  if (transacao.status === 'estornada') {
    throw new AppError('VALIDATION_ERROR', 'Transação já foi estornada.', 422)
  }

  const diasDesde = (Date.now() - transacao.criadoEm.getTime()) / (1000 * 60 * 60 * 24)
  if (diasDesde > 30) throw Errors.estornoPrazoExpirado()

  const envolvido = transacao.compradorId === requester.entityId || transacao.vendedorId === requester.entityId
  const admin = requester.role === 'superadmin' || requester.role === 'agency_admin'
  if (!envolvido && !admin) throw Errors.forbidden()

  const existente = await prisma.solicitacaoEstorno.findFirst({
    where: { transacaoId: input.transacaoId, status: { in: ['em_analise', 'encaminhado'] } },
  })
  if (existente) {
    throw new AppError('VALIDATION_ERROR', 'Já existe uma solicitação de estorno em andamento para esta transação.', 422)
  }

  return prisma.solicitacaoEstorno.create({
    data: { transacaoId: input.transacaoId, solicitanteId: requester.id, motivo: input.motivo },
    include,
  })
}

export async function listarMinhas(usuarioId: string, query: ListEstornoQueryType) {
  const { page, limit, status } = query
  const where = { solicitanteId: usuarioId, ...(status ? { status } : {}) }
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoEstorno.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
    prisma.solicitacaoEstorno.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarFilhas(agenciaId: string, query: ListEstornoQueryType) {
  const { page, limit, status } = query
  const where = {
    ...(status ? { status } : {}),
    transacao: {
      OR: [{ comprador: { agenciaId } }, { vendedor: { agenciaId } }],
    },
  }
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoEstorno.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
    prisma.solicitacaoEstorno.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarMatriz(query: ListEstornoQueryType) {
  const { page, limit, status } = query
  const where = { status: status ?? { in: ['encaminhado', 'aprovado', 'negado'] as ('encaminhado' | 'aprovado' | 'negado')[] } }
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoEstorno.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
    prisma.solicitacaoEstorno.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarTodas(query: ListEstornoQueryType) {
  const { page, limit, status } = query
  const where = status ? { status } : {}
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoEstorno.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
    prisma.solicitacaoEstorno.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function encaminhar(id: string) {
  const solicitacao = await prisma.solicitacaoEstorno.findUnique({ where: { id } })
  if (!solicitacao) throw Errors.notFound('Solicitação de estorno')
  if (solicitacao.status !== 'em_analise') {
    throw new AppError('VALIDATION_ERROR', 'Apenas solicitações em análise podem ser encaminhadas.', 422)
  }
  return prisma.solicitacaoEstorno.update({ where: { id }, data: { status: 'encaminhado' }, include })
}

export async function finalizar(id: string, status: 'aprovado' | 'negado', usuarioId: string) {
  const solicitacao = await prisma.solicitacaoEstorno.findUnique({ where: { id } })
  if (!solicitacao) throw Errors.notFound('Solicitação de estorno')
  if (solicitacao.status !== 'encaminhado' && solicitacao.status !== 'em_analise') {
    throw new AppError('VALIDATION_ERROR', 'Solicitação já finalizada.', 422)
  }

  if (status === 'aprovado') {
    await transactionService.estorno(solicitacao.transacaoId, usuarioId)
    await prisma.solicitacaoEstorno.update({ where: { id }, data: { status: 'aprovado' } })
  } else {
    await prisma.solicitacaoEstorno.update({ where: { id }, data: { status: 'negado' } })
  }

  return prisma.solicitacaoEstorno.findUnique({ where: { id }, include })
}
