import { prisma } from '../../config/prisma.js'
import { Errors } from '../../shared/errors/AppError.js'
import type { SolicitarCreditoInput, AtualizarCreditoInput, ListCreditoQueryType } from './credito.schema.js'

export async function solicitarCredito(associadoId: string, input: SolicitarCreditoInput) {
  const associado = await prisma.associado.findUnique({
    where: { id: associadoId },
    select: { id: true, status: true },
  })
  if (!associado) throw Errors.notFound('Associado')
  if (associado.status === 'suspenso') throw Errors.associateSuspended()

  return prisma.solicitacaoCredito.create({
    data: { associadoId, ...input },
    include: { associado: { select: { nome: true, conta: { select: { numero: true } } } } },
  })
}

export async function listarMeusCreditos(associadoId: string, query: ListCreditoQueryType) {
  const { page, limit, status } = query
  const where = { associadoId, ...(status ? { status } : {}) }
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoCredito.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { associado: { select: { nome: true, conta: { select: { numero: true } } } } },
    }),
    prisma.solicitacaoCredito.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarCreditosFilhos(agenciaId: string, query: ListCreditoQueryType) {
  const { page, limit, status } = query
  const associados = await prisma.associado.findMany({
    where: { agenciaId },
    select: { id: true },
  })
  const ids = associados.map((a) => a.id)
  const where = { associadoId: { in: ids }, ...(status ? { status } : {}) }
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoCredito.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { associado: { select: { nome: true, agencia: { select: { nome: true } }, conta: { select: { numero: true } } } } },
    }),
    prisma.solicitacaoCredito.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarCreditosMatriz(query: ListCreditoQueryType) {
  const { page, limit, status } = query
  const where = {
    status: status ?? { in: ['encaminhado', 'aprovado', 'negado'] as ('encaminhado' | 'aprovado' | 'negado')[] },
  }
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoCredito.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { associado: { select: { nome: true, agencia: { select: { nome: true } }, conta: { select: { numero: true } } } } },
    }),
    prisma.solicitacaoCredito.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarTodosCreditos(query: ListCreditoQueryType) {
  const { page, limit, status } = query
  const where = status ? { status } : {}
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoCredito.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { associado: { select: { nome: true, agencia: { select: { nome: true } }, conta: { select: { numero: true } } } } },
    }),
    prisma.solicitacaoCredito.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function atualizarCredito(id: string, associadoId: string, input: AtualizarCreditoInput) {
  const credito = await prisma.solicitacaoCredito.findUnique({ where: { id } })
  if (!credito) throw Errors.notFound('Solicitação de crédito')
  if (credito.associadoId !== associadoId) throw Errors.forbidden()
  if (credito.status === 'aprovado' || credito.status === 'negado')
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Não é possível editar uma solicitação já finalizada.',
      422,
    )
  return prisma.solicitacaoCredito.update({ where: { id }, data: input })
}

export async function deletarCredito(id: string, associadoId: string) {
  const credito = await prisma.solicitacaoCredito.findUnique({ where: { id } })
  if (!credito) throw Errors.notFound('Solicitação de crédito')
  if (credito.associadoId !== associadoId) throw Errors.forbidden()
  if (credito.status === 'aprovado' || credito.status === 'negado')
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Não é possível excluir uma solicitação já finalizada.',
      422,
    )
  await prisma.solicitacaoCredito.delete({ where: { id } })
}

export async function encaminharCredito(id: string) {
  const credito = await prisma.solicitacaoCredito.findUnique({ where: { id } })
  if (!credito) throw Errors.notFound('Solicitação de crédito')
  if (credito.status !== 'em_analise')
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Apenas solicitações em análise podem ser encaminhadas.',
      422,
    )
  return prisma.solicitacaoCredito.update({ where: { id }, data: { status: 'encaminhado' } })
}

export async function finalizarCredito(id: string, status: 'aprovado' | 'negado') {
  const credito = await prisma.solicitacaoCredito.findUnique({
    where: { id },
    include: { associado: { include: { conta: true } } },
  })
  if (!credito) throw Errors.notFound('Solicitação de crédito')
  if (credito.status !== 'encaminhado' && credito.status !== 'em_analise')
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Solicitação já finalizada.',
      422,
    )

  if (status === 'aprovado') {
    const conta = credito.associado.conta
    if (!conta) throw Errors.notFound('Conta do associado')

    await prisma.$transaction([
      prisma.solicitacaoCredito.update({ where: { id }, data: { status: 'aprovado' } }),
      prisma.movimentacaoConta.create({
        data: {
          contaId: conta.id,
          tipo: 'credito',
          valor: credito.valorSolicitado,
          saldoApos: Number(conta.saldo) + Number(credito.valorSolicitado),
          descricao: `Crédito aprovado — solicitação #${id.slice(0, 8)}`,
        },
      }),
      prisma.conta.update({
        where: { id: conta.id },
        data: { saldo: { increment: credito.valorSolicitado } },
      }),
    ])
  } else {
    await prisma.solicitacaoCredito.update({ where: { id }, data: { status: 'negado' } })
  }

  return prisma.solicitacaoCredito.findUnique({ where: { id } })
}
