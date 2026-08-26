import { prisma } from '../../config/prisma.js'
import { Errors } from '../../shared/errors/AppError.js'
import type { SolicitarCreditoInput, AtualizarCreditoInput, ListCreditoQueryType } from './credito.schema.js'

export type CreditoRequester = { entityType: 'associado' | 'agencia'; entityId: string }

const creditoInclude = {
  associado: { select: { nome: true, agencia: { select: { nome: true } }, conta: { select: { numero: true } } } },
  agencia: { select: { nome: true, conta: { select: { numero: true } } } },
}

export async function solicitarCredito(requester: CreditoRequester, input: SolicitarCreditoInput) {
  if (requester.entityType === 'agencia') {
    const agencia = await prisma.agencia.findUnique({
      where: { id: requester.entityId },
      select: { id: true, status: true },
    })
    if (!agencia) throw Errors.notFound('Agência')
    if (agencia.status === 'suspenso') throw Errors.agencySuspended()

    return prisma.solicitacaoCredito.create({
      data: { agenciaId: requester.entityId, ...input },
      include: creditoInclude,
    })
  }

  const associado = await prisma.associado.findUnique({
    where: { id: requester.entityId },
    select: { id: true, status: true },
  })
  if (!associado) throw Errors.notFound('Associado')
  if (associado.status === 'suspenso') throw Errors.associateSuspended()

  return prisma.solicitacaoCredito.create({
    data: { associadoId: requester.entityId, ...input },
    include: creditoInclude,
  })
}

export async function listarMeusCreditos(requester: CreditoRequester, query: ListCreditoQueryType) {
  const { page, limit, status } = query
  const dono = requester.entityType === 'agencia' ? { agenciaId: requester.entityId } : { associadoId: requester.entityId }
  const where = { ...dono, ...(status ? { status } : {}) }
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoCredito.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: creditoInclude,
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
      include: creditoInclude,
    }),
    prisma.solicitacaoCredito.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listarCreditosMatriz(query: ListCreditoQueryType) {
  const { page, limit, status } = query
  // Associado sem agência (cadastrado direto pela Matriz) não tem quem
  // encaminhar, e Agência solicitando pra si mesma idem — a solicitação tem
  // que chegar em_analise mesmo pra fila da Matriz.
  const where = status
    ? { status }
    : {
        OR: [
          { status: { in: ['encaminhado', 'aprovado', 'negado'] as ('encaminhado' | 'aprovado' | 'negado')[] } },
          { status: 'em_analise' as const, associado: { agenciaId: null } },
          { status: 'em_analise' as const, agenciaId: { not: null } },
        ],
      }
  const [items, total] = await prisma.$transaction([
    prisma.solicitacaoCredito.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: creditoInclude,
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
      include: creditoInclude,
    }),
    prisma.solicitacaoCredito.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function atualizarCredito(id: string, requester: CreditoRequester, input: AtualizarCreditoInput) {
  const credito = await prisma.solicitacaoCredito.findUnique({ where: { id } })
  if (!credito) throw Errors.notFound('Solicitação de crédito')
  const dono = requester.entityType === 'agencia' ? credito.agenciaId : credito.associadoId
  if (dono !== requester.entityId) throw Errors.forbidden()
  if (credito.status === 'aprovado' || credito.status === 'negado')
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Não é possível editar uma solicitação já finalizada.',
      422,
    )
  return prisma.solicitacaoCredito.update({ where: { id }, data: input })
}

export async function deletarCredito(id: string, requester: CreditoRequester) {
  const credito = await prisma.solicitacaoCredito.findUnique({ where: { id } })
  if (!credito) throw Errors.notFound('Solicitação de crédito')
  const dono = requester.entityType === 'agencia' ? credito.agenciaId : credito.associadoId
  if (dono !== requester.entityId) throw Errors.forbidden()
  if (credito.status === 'aprovado' || credito.status === 'negado')
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Não é possível excluir uma solicitação já finalizada.',
      422,
    )
  await prisma.solicitacaoCredito.delete({ where: { id } })
}

export async function encaminharCredito(id: string, requester: { role: string; entityId: string }) {
  const credito = await prisma.solicitacaoCredito.findUnique({
    where: { id },
    include: { associado: { select: { agenciaId: true } } },
  })
  if (!credito) throw Errors.notFound('Solicitação de crédito')
  if (credito.status !== 'em_analise')
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Apenas solicitações em análise podem ser encaminhadas.',
      422,
    )

  // Pedido da própria Agência já cai direto na fila da Matriz — não existe
  // "encaminhar" pra esse caso.
  if (!credito.associado) {
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Essa solicitação não precisa ser encaminhada.',
      422,
    )
  }

  // agency_admin só encaminha solicitações dos próprios associados — 404 em vez
  // de 403 pra não confirmar a existência do id pra quem não tem acesso.
  if (requester.role !== 'superadmin' && credito.associado.agenciaId !== requester.entityId) {
    throw Errors.notFound('Solicitação de crédito')
  }

  return prisma.solicitacaoCredito.update({ where: { id }, data: { status: 'encaminhado' } })
}

export async function finalizarCredito(
  id: string,
  status: 'aprovado' | 'negado',
  respostaMatrizInput?: string,
) {
  // Campo opcional — string vazia normaliza pra null em vez de ficar salva
  // como '' no banco.
  const respostaMatriz = respostaMatrizInput || null
  const credito = await prisma.solicitacaoCredito.findUnique({
    where: { id },
    include: { associado: { include: { conta: true } }, agencia: { include: { conta: true } } },
  })
  if (!credito) throw Errors.notFound('Solicitação de crédito')
  if (credito.status !== 'encaminhado' && credito.status !== 'em_analise')
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Solicitação já finalizada.',
      422,
    )

  if (status === 'aprovado') {
    // "Crédito" é pedido de AUMENTO DE LIMITE, não injeção de saldo — a Matriz
    // não dá RT de graça, ela libera mais espaço pro associado/agência ficar
    // negativo quando comprar de verdade (RT só entra em circulação nesse
    // momento, via permuta/negociada normal). limiteCredito fica sincronizado
    // na entidade dona (fonte editável no cadastro) e em Conta (usado na
    // validação de saldo/CHECK do banco) — mesmo padrão de sincronização de
    // associate.service.ts::update() / agency.service.ts::update().
    if (credito.associado) {
      const conta = credito.associado.conta
      if (!conta) throw Errors.notFound('Conta do associado')
      const novoLimite = Number(credito.associado.limiteCredito ?? 0) + Number(credito.valorSolicitado)

      await prisma.$transaction([
        prisma.solicitacaoCredito.update({ where: { id }, data: { status: 'aprovado', respostaMatriz } }),
        prisma.associado.update({ where: { id: credito.associadoId! }, data: { limiteCredito: novoLimite } }),
        prisma.conta.update({ where: { id: conta.id }, data: { limiteCredito: novoLimite } }),
      ])
    } else {
      const conta = credito.agencia!.conta
      if (!conta) throw Errors.notFound('Conta da Agência')
      const novoLimite = Number(credito.agencia!.limiteCredito ?? 0) + Number(credito.valorSolicitado)

      await prisma.$transaction([
        prisma.solicitacaoCredito.update({ where: { id }, data: { status: 'aprovado', respostaMatriz } }),
        prisma.agencia.update({ where: { id: credito.agenciaId! }, data: { limiteCredito: novoLimite } }),
        prisma.conta.update({ where: { id: conta.id }, data: { limiteCredito: novoLimite } }),
      ])
    }
  } else {
    await prisma.solicitacaoCredito.update({ where: { id }, data: { status: 'negado', respostaMatriz } })
  }

  return prisma.solicitacaoCredito.findUnique({ where: { id } })
}
