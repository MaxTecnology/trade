import { Prisma } from '@prisma/client'
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
      comprador: {
        select: { id: true, nome: true, agenciaId: true, agencia: { select: { nome: true } } },
      },
      vendedor: {
        select: { id: true, nome: true, agenciaId: true, agencia: { select: { nome: true } } },
      },
      contaOrigem: { select: { agenciaId: true, agencia: { select: { nome: true } } } },
      contaDestino: { select: { agenciaId: true, agencia: { select: { nome: true } } } },
    },
  },
} as const

export async function solicitarEstorno(
  requester: { id: string; role: string; entityId: string; contaId?: string },
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

  // compradorId/vendedorId só são preenchidos quando a parte é um Associado —
  // Agência/Matriz participando diretamente (via Oferta) só aparecem em
  // contaOrigemId/contaDestinoId, que já cobrem os três tipos de conta.
  const envolvido =
    transacao.compradorId === requester.entityId ||
    transacao.vendedorId === requester.entityId ||
    (!!requester.contaId &&
      (transacao.contaOrigemId === requester.contaId || transacao.contaDestinoId === requester.contaId))
  const admin = requester.role === 'superadmin' || requester.role === 'agency_admin'
  if (!envolvido && !admin) throw Errors.forbidden()

  const existente = await prisma.solicitacaoEstorno.findFirst({
    where: { transacaoId: input.transacaoId, status: { in: ['em_analise', 'encaminhado'] } },
  })
  if (existente) {
    throw new AppError('VALIDATION_ERROR', 'Já existe uma solicitação de estorno em andamento para esta transação.', 422)
  }

  // A checagem acima (findFirst) tem uma corrida: duas requisições concorrentes
  // pra mesma transação podem ambas passar antes de qualquer create acontecer.
  // O índice único parcial no banco (migration 20260822011824) garante a regra
  // de qualquer forma — a segunda tentativa concorrente cai aqui, código P2002
  // (unique constraint), mapeada pro mesmo erro amigável da checagem acima.
  try {
    return await prisma.solicitacaoEstorno.create({
      data: { transacaoId: input.transacaoId, solicitanteId: requester.id, motivo: input.motivo },
      include,
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      error.meta?.modelName === 'SolicitacaoEstorno'
    ) {
      throw new AppError('VALIDATION_ERROR', 'Já existe uma solicitação de estorno em andamento para esta transação.', 422)
    }
    throw error
  }
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

export async function listarFilhas(agenciaId: string, query: ListEstornoQueryType, contaId?: string) {
  const { page, limit, status } = query
  // Cobre tanto os associados da agência (via comprador/vendedor.agenciaId)
  // quanto a própria agência participando diretamente da transação (via
  // contaOrigemId/contaDestinoId, já que uma Agência comprando/vendendo não
  // tem comprador/vendedor Associado nenhum pra casar com esse filtro).
  const condicoes: Record<string, unknown>[] = [{ comprador: { agenciaId } }, { vendedor: { agenciaId } }]
  if (contaId) condicoes.push({ contaOrigemId: contaId }, { contaDestinoId: contaId })
  const where = {
    ...(status ? { status } : {}),
    transacao: { OR: condicoes },
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

// Nenhuma das partes (comprador/vendedor Associado, ou a própria Agência via
// contaOrigem/contaDestino) pertence a uma Agência — não existe quem encaminhar,
// então a solicitação tem que chegar em_analise mesmo pra fila da Matriz.
const semAgencia = {
  AND: [
    { OR: [{ compradorId: null }, { comprador: { agenciaId: null } }] },
    { OR: [{ vendedorId: null }, { vendedor: { agenciaId: null } }] },
    { contaOrigem: { agenciaId: null } },
    { contaDestino: { agenciaId: null } },
  ],
}

export async function listarMatriz(query: ListEstornoQueryType) {
  const { page, limit, status } = query
  const where = status
    ? { status }
    : {
        OR: [
          { status: { in: ['encaminhado', 'aprovado', 'negado'] as ('encaminhado' | 'aprovado' | 'negado')[] } },
          { status: 'em_analise' as const, transacao: semAgencia },
        ],
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

export async function encaminhar(
  id: string,
  requester: { role: string; entityId: string; contaId?: string },
) {
  const solicitacao = await prisma.solicitacaoEstorno.findUnique({
    where: { id },
    include: {
      transacao: {
        select: {
          comprador: { select: { agenciaId: true } },
          vendedor: { select: { agenciaId: true } },
          contaOrigemId: true,
          contaDestinoId: true,
        },
      },
    },
  })
  if (!solicitacao) throw Errors.notFound('Solicitação de estorno')
  if (solicitacao.status !== 'em_analise') {
    throw new AppError('VALIDATION_ERROR', 'Apenas solicitações em análise podem ser encaminhadas.', 422)
  }

  // agency_admin só encaminha solicitações da própria agência (associados, ou a
  // própria agência participando direto da transação) — 404 em vez de 403 pra
  // não confirmar a existência do id pra quem não tem acesso.
  if (requester.role !== 'superadmin') {
    const { transacao } = solicitacao
    const daAgencia =
      transacao.comprador?.agenciaId === requester.entityId ||
      transacao.vendedor?.agenciaId === requester.entityId ||
      (!!requester.contaId &&
        (transacao.contaOrigemId === requester.contaId || transacao.contaDestinoId === requester.contaId))
    if (!daAgencia) throw Errors.notFound('Solicitação de estorno')
  }

  return prisma.solicitacaoEstorno.update({ where: { id }, data: { status: 'encaminhado' }, include })
}

export async function finalizar(
  id: string,
  status: 'aprovado' | 'negado',
  usuarioId: string,
  respostaMatriz: string,
) {
  const solicitacao = await prisma.solicitacaoEstorno.findUnique({ where: { id } })
  if (!solicitacao) throw Errors.notFound('Solicitação de estorno')
  if (solicitacao.status !== 'encaminhado' && solicitacao.status !== 'em_analise') {
    throw new AppError('VALIDATION_ERROR', 'Solicitação já finalizada.', 422)
  }

  if (status === 'aprovado') {
    await transactionService.estorno(solicitacao.transacaoId, usuarioId)
    await prisma.solicitacaoEstorno.update({ where: { id }, data: { status: 'aprovado', respostaMatriz } })
  } else {
    await prisma.solicitacaoEstorno.update({ where: { id }, data: { status: 'negado', respostaMatriz } })
  }

  return prisma.solicitacaoEstorno.findUnique({ where: { id }, include })
}
