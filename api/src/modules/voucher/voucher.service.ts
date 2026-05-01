import { prisma } from '../../config/prisma.js'
import { getRedis } from '../../config/redis.js'
import { Errors } from '../../shared/errors/AppError.js'

export async function getById(id: string) {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: {
      transacao: {
        include: {
          comprador: { select: { nome: true } },
          vendedor: { select: { nome: true } },
          oferta: { select: { titulo: true } },
        },
      },
    },
  })
  if (!voucher) throw Errors.notFound('Voucher')
  return voucher
}

export async function getPdf(id: string) {
  const redis = getRedis()
  const cacheKey = `voucher_pdf:${id}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const voucher = await getById(id)
  const pdf = {
    id: voucher.id,
    codigo: voucher.codigo,
    emitidoEm: voucher.emitidoEm,
    transacao: voucher.transacao,
    // PDF generation would be done here with a library like PDFKit
    pdfUrl: voucher.pdfUrl ?? null,
  }

  await redis.set(cacheKey, JSON.stringify(pdf), 'EX', 3600)
  return pdf
}

export async function verificar(codigo: string) {
  const voucher = await prisma.voucher.findUnique({
    where: { codigo },
    include: {
      transacao: {
        select: {
          tipo: true,
          status: true,
          valorRT: true,
          criadoEm: true,
          comprador: { select: { nome: true } },
          vendedor: { select: { nome: true } },
          oferta: { select: { titulo: true } },
        },
      },
    },
  })
  if (!voucher) throw Errors.notFound('Voucher')
  return voucher
}
