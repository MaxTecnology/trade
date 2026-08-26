import { prisma } from '../../config/prisma.js'
import { Errors } from '../../shared/errors/AppError.js'
import type { CreateOfferInput, UpdateOfferInput, ListOfferQuery } from './offer.schema.js'

export async function create(input: CreateOfferInput, contaId: string) {
  const conta = await prisma.conta.findUnique({
    where: { id: contaId },
    include: { associado: true, agencia: true },
  })
  if (!conta) throw Errors.notFound('Conta')

  if (conta.entityType === 'associado') {
    if (!conta.associado) throw Errors.notFound('Associado')
    if (conta.associado.statusLoja !== 'aberta') throw Errors.lojaFechada()
    if (conta.associado.status !== 'ativo') throw Errors.associateSuspended()
  } else if (conta.entityType === 'agencia') {
    if (!conta.agencia) throw Errors.notFound('Agência')
    if (conta.agencia.status !== 'ativo') throw Errors.agencySuspended()
  }
  // Matriz: sem loja, sem status pra checar.

  const categoria = await prisma.categoria.findUnique({ where: { id: input.categoriaId } })
  if (!categoria || !categoria.ativo) throw Errors.notFound('Categoria')

  return prisma.oferta.create({
    data: {
      titulo: input.titulo,
      descricao: input.descricao,
      categoriaId: input.categoriaId,
      valorRT: input.valorRT,
      quantidadeDisponivel: input.quantidadeDisponivel,
      quantidadeTotal: input.quantidadeDisponivel,
      tipoAtendimento: input.tipoAtendimento,
      cidade: input.cidade,
      estado: input.estado,
      imagemUrl: input.imagemUrl,
      vencimento: input.vencimento ? new Date(input.vencimento) : undefined,
      contaId,
      associadoId: conta.entityType === 'associado' ? conta.associadoId : null,
    },
  })
}

export async function list(query: ListOfferQuery, exceptContaId?: string) {
  const { categoria, cidade, estado, valorMin, valorMax, tipoAtendimento, page, limit } = query
  const skip = (page - 1) * limit

  const where = {
    status: 'aberta' as const,
    OR: [
      { conta: { entityType: 'matriz' as const } },
      { conta: { entityType: 'agencia' as const, agencia: { status: 'ativo' as const } } },
      { conta: { entityType: 'associado' as const, associado: { statusLoja: 'aberta' as const, status: 'ativo' as const } } },
    ],
    ...(exceptContaId ? { contaId: { not: exceptContaId } } : {}),
    ...(categoria ? { categoriaId: categoria } : {}),
    ...(cidade ? { cidade } : {}),
    ...(estado ? { estado } : {}),
    ...(valorMin || valorMax
      ? {
          valorRT: {
            ...(valorMin ? { gte: valorMin } : {}),
            ...(valorMax ? { lte: valorMax } : {}),
          },
        }
      : {}),
    ...(tipoAtendimento ? { tipoAtendimento: { has: tipoAtendimento } } : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.oferta.findMany({
      where,
      skip,
      take: limit,
      include: {
        categoria: true,
        conta: { include: { associado: { select: { nome: true } }, agencia: { select: { nome: true } } } },
      },
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.oferta.count({ where }),
  ])
  return { items, total }
}

export async function getById(id: string) {
  const oferta = await prisma.oferta.findUnique({
    where: { id },
    include: {
      categoria: true,
      conta: { include: { associado: { select: { nome: true } }, agencia: { select: { nome: true } } } },
    },
  })
  if (!oferta) throw Errors.notFound('Oferta')
  return oferta
}

export async function update(id: string, input: UpdateOfferInput, contaId: string) {
  const oferta = await prisma.oferta.findUnique({ where: { id } })
  if (!oferta) throw Errors.notFound('Oferta')
  if (oferta.contaId !== contaId) throw Errors.forbidden()
  return prisma.oferta.update({
    where: { id },
    data: { ...input, vencimento: input.vencimento ? new Date(input.vencimento) : undefined },
  })
}

export async function setStatus(
  id: string,
  status: 'aberta' | 'fechada' | 'pausada',
  contaId: string,
) {
  const oferta = await prisma.oferta.findUnique({ where: { id } })
  if (!oferta) throw Errors.notFound('Oferta')
  if (oferta.contaId !== contaId) throw Errors.forbidden()
  return prisma.oferta.update({ where: { id }, data: { status } })
}

export async function minhaLoja(contaId: string, page: number, limit: number) {
  const skip = (page - 1) * limit
  const where = { contaId }
  const [items, total] = await prisma.$transaction([
    prisma.oferta.findMany({
      where,
      skip,
      take: limit,
      include: { categoria: true },
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.oferta.count({ where }),
  ])
  return { items, total }
}
