import { prisma } from '../../config/prisma.js'
import { Errors } from '../../shared/errors/AppError.js'
import type { CreateOfferInput, UpdateOfferInput, ListOfferQuery } from './offer.schema.js'

export async function create(input: CreateOfferInput, associadoId: string) {
  const associado = await prisma.associado.findUnique({ where: { id: associadoId } })
  if (!associado) throw Errors.notFound('Associado')
  if (associado.statusLoja !== 'aberta') throw Errors.lojaFechada()
  if (associado.status !== 'ativo') throw Errors.associateSuspended()

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
      associadoId,
    },
  })
}

export async function list(query: ListOfferQuery) {
  const { categoria, cidade, estado, valorMin, valorMax, tipoAtendimento, page, limit } = query
  const skip = (page - 1) * limit

  const where = {
    status: 'aberta' as const,
    associado: { statusLoja: 'aberta' as const, status: 'ativo' as const },
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
      include: { categoria: true, associado: { select: { nome: true, cidade: true, estado: true } } },
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.oferta.count({ where }),
  ])
  return { items, total }
}

export async function getById(id: string) {
  const oferta = await prisma.oferta.findUnique({
    where: { id },
    include: { categoria: true, associado: { select: { nome: true, cidade: true, estado: true } } },
  })
  if (!oferta) throw Errors.notFound('Oferta')
  return oferta
}

export async function update(id: string, input: UpdateOfferInput, associadoId: string) {
  const oferta = await prisma.oferta.findUnique({ where: { id } })
  if (!oferta) throw Errors.notFound('Oferta')
  if (oferta.associadoId !== associadoId) throw Errors.forbidden()
  return prisma.oferta.update({ where: { id }, data: input })
}

export async function setStatus(
  id: string,
  status: 'aberta' | 'fechada' | 'pausada',
  associadoId: string,
) {
  const oferta = await prisma.oferta.findUnique({ where: { id } })
  if (!oferta) throw Errors.notFound('Oferta')
  if (oferta.associadoId !== associadoId) throw Errors.forbidden()
  return prisma.oferta.update({ where: { id }, data: { status } })
}

export async function minhaLoja(associadoId: string, page: number, limit: number) {
  const skip = (page - 1) * limit
  const where = { associadoId }
  const [items, total] = await prisma.$transaction([
    prisma.oferta.findMany({ where, skip, take: limit, orderBy: { criadoEm: 'desc' } }),
    prisma.oferta.count({ where }),
  ])
  return { items, total }
}
