import { prisma } from '../../config/prisma.js'
import { Errors } from '../../shared/errors/AppError.js'
import type { CriarCobrancaInput, ListCobrancaQueryType } from './cobranca.schema.js'

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
  const cobranca = await prisma.cobranca.findUnique({ where: { id } })
  if (!cobranca) throw Errors.notFound('Cobrança')
  if (cobranca.pago) throw new (await import('../../shared/errors/AppError.js')).AppError(
    'VALIDATION_ERROR', 'Cobrança já quitada.', 422,
  )
  return prisma.cobranca.update({ where: { id }, data: { pago: true }, include })
}

export async function deletarCobranca(id: string) {
  const cobranca = await prisma.cobranca.findUnique({ where: { id } })
  if (!cobranca) throw Errors.notFound('Cobrança')
  await prisma.cobranca.delete({ where: { id } })
}
