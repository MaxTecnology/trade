import { prisma } from '../../config/prisma.js'
import { getRedis } from '../../config/redis.js'
import { Errors } from '../../shared/errors/AppError.js'

export type VoucherRequester = { role: string; entityType: string; entityId: string }

// comprador/vendedor (FK direta pra Associado) só existem quando essa ponta da
// transação é um Associado — Agência/Matriz participando direto deixam esses
// campos null e o nome vem de contaOrigem/contaDestino. agenciaId em ambos os
// grupos serve pra checagem de dono (Agência vê voucher próprio ou dos seus
// associados) — mesmo padrão de transaction.service.ts::list().
const transacaoInclude = {
  comprador: { select: { nome: true, agenciaId: true } },
  vendedor: { select: { nome: true, agenciaId: true } },
  contaOrigem: { select: { entityType: true, agenciaId: true, agencia: { select: { nome: true } } } },
  contaDestino: { select: { entityType: true, agenciaId: true, agencia: { select: { nome: true } } } },
  oferta: { select: { titulo: true } },
}

function podeVer(transacao: {
  compradorId: string | null
  vendedorId: string | null
  comprador: { agenciaId: string | null } | null
  vendedor: { agenciaId: string | null } | null
  contaOrigem: { entityType: string; agenciaId: string | null } | null
  contaDestino: { entityType: string; agenciaId: string | null } | null
}, requester: VoucherRequester) {
  if (requester.role === 'superadmin') return true

  if (requester.entityType === 'associado') {
    return transacao.compradorId === requester.entityId || transacao.vendedorId === requester.entityId
  }

  if (requester.entityType === 'agencia') {
    const participouDireto =
      (transacao.contaOrigem?.entityType === 'agencia' && transacao.contaOrigem.agenciaId === requester.entityId) ||
      (transacao.contaDestino?.entityType === 'agencia' && transacao.contaDestino.agenciaId === requester.entityId)
    const associadoDaAgencia =
      transacao.comprador?.agenciaId === requester.entityId || transacao.vendedor?.agenciaId === requester.entityId
    return participouDireto || associadoDaAgencia
  }

  return false
}

export async function getById(id: string, requester: VoucherRequester) {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: { transacao: { include: transacaoInclude } },
  })
  // 404 em vez de 403 pra quem não participou — não confirma a existência
  // do id pra quem não tem acesso (mesmo padrão de encaminharCredito).
  if (!voucher || !podeVer(voucher.transacao, requester)) throw Errors.notFound('Voucher')
  return voucher
}

export async function getPdf(id: string, requester: VoucherRequester) {
  const redis = getRedis()
  const cacheKey = `voucher_pdf:${id}:${requester.entityType}:${requester.entityId}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const voucher = await getById(id, requester)
  const pdf = {
    id: voucher.id,
    codigo: voucher.codigo,
    emitidoEm: voucher.emitidoEm,
    transacao: voucher.transacao,
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
          ...transacaoInclude,
        },
      },
    },
  })
  if (!voucher) throw Errors.notFound('Voucher')
  return voucher
}
