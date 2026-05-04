import { Queue, Worker, QueueEvents } from 'bullmq'
import { getRedis } from '../../config/redis.js'
import { prisma } from '../../config/prisma.js'

function conn() {
  return { connection: getRedis() }
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  // Mantém jobs falhos para reprocessamento manual (dead-letter)
  removeOnFail: false as const,
}

// Fila de dead-letter: recebe jobs que esgotaram todas as tentativas
export const dlq = new Queue('dead-letter', {
  ...conn(),
  defaultJobOptions: { removeOnFail: { count: 500 } },
})

// ── Queues ────────────────────────────────────────────────
const QUEUE_NAMES = [
  'voucher.generate',
  'commission.calculate',
  'commission.gerente',
  'notification.send',
  'offer.close',
] as const

export const queues = {
  voucherGenerate: new Queue('voucher.generate', { ...conn(), defaultJobOptions }),
  commissionCalculate: new Queue('commission.calculate', { ...conn(), defaultJobOptions }),
  commissionGerente: new Queue('commission.gerente', { ...conn(), defaultJobOptions }),
  notificationSend: new Queue('notification.send', { ...conn(), defaultJobOptions }),
  offerClose: new Queue('offer.close', { ...conn(), defaultJobOptions }),
}

// Monitora falhas em todas as filas e envia para DLQ após esgotar tentativas
function attachDlqMonitor(queueName: string) {
  const events = new QueueEvents(queueName, conn())
  events.on('failed', async ({ jobId, failedReason }) => {
    const queue = new Queue(queueName, conn())
    const job = await queue.getJob(jobId)
    if (!job) return
    if ((job.attemptsMade ?? 0) >= (job.opts.attempts ?? 1)) {
      await dlq.add(queueName, {
        originalQueue: queueName,
        jobId,
        data: job.data,
        failedReason,
        failedAt: new Date().toISOString(),
      })
    }
    await queue.close()
  })
}

// ── Workers ───────────────────────────────────────────────
export function startWorkers() {
  new Worker(
    'voucher.generate',
    async (job) => {
      const { transacaoId } = job.data as { transacaoId: string }
      await prisma.voucher.upsert({
        where: { transacaoId },
        update: {},
        create: { transacaoId },
      })
    },
    conn(),
  )

  new Worker(
    'commission.calculate',
    async (job) => {
      const { transacaoId } = job.data as { transacaoId: string }
      const transacao = await prisma.transacao.findUnique({ where: { id: transacaoId } })
      if (!transacao?.valorRT) return
      // comissaoBRL already stored during permuta transaction
    },
    conn(),
  )

  new Worker(
    'commission.gerente',
    async (job) => {
      const { transacaoId } = job.data as { transacaoId: string }
      const transacao = await prisma.transacao.findUnique({
        where: { id: transacaoId },
        include: { comprador: { include: { gerente: true } } },
      })
      if (!transacao?.comprador?.gerenteId || !transacao.comprador.gerente) return

      const gerente = transacao.comprador.gerente
      if (!gerente.percentualComissao) return

      // Opção A: comissão é X% do valor RT da transação
      const comissaoRT =
        Number(transacao.valorRT) * (Number(gerente.percentualComissao) / 100)

      await prisma.comissaoGerente.create({
        data: {
          gerenteId: gerente.id,
          associadoId: transacao.compradorId!,
          transacaoId,
          tipoComissao: 'transacao',
          baseValorRT: transacao.valorRT,
          percentual: gerente.percentualComissao,
          comissaoBRL: 0,
          comissaoRT,
        },
      })
    },
    conn(),
  )

  new Worker(
    'notification.send',
    async (_job) => {
      // Email notification stub — implement email provider here
    },
    conn(),
  )

  new Worker(
    'offer.close',
    async (job) => {
      const { ofertaId } = job.data as { ofertaId: string }
      const oferta = await prisma.oferta.findUnique({ where: { id: ofertaId } })
      if (oferta && oferta.quantidadeDisponivel <= 0) {
        await prisma.oferta.update({ where: { id: ofertaId }, data: { status: 'fechada' } })
      }
    },
    conn(),
  )

  // Attach DLQ monitors after all workers are registered
  for (const name of QUEUE_NAMES) {
    attachDlqMonitor(name)
  }
}
