import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
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
  const cobranca = await prisma.cobranca.findUnique({ where: { id }, include: { agencia: { include: { conta: true } } } })
  if (!cobranca) throw Errors.notFound('Cobrança')
  if (cobranca.pago) throw new AppError('VALIDATION_ERROR', 'Cobrança já quitada.', 422)

  // Cobrança em BRL é liquidada fora do sistema (PIX/boleto) — "quitar" só reconcilia manualmente.
  // Cobrança em RT é liquidada DENTRO do sistema — "quitar" precisa mover o RT de verdade,
  // senão a dívida nunca é paga de fato (só fica marcada como paga).
  if (cobranca.valorRT) {
    const contaDevedora = await prisma.conta.findUniqueOrThrow({ where: { id: cobranca.contaId } })
    const valor = Number(cobranca.valorRT)
    if (Number(contaDevedora.saldo) < valor) throw Errors.insufficientBalance()

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
