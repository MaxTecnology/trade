import { Queue, Worker, QueueEvents } from 'bullmq'
import { getRedis } from '../../config/redis.js'
import { prisma } from '../../config/prisma.js'
import { gerarCobrancasComissaoMensal } from '../cobranca/cobranca.service.js'
import { registrarComissoesGerenteDaTransacao, gerarPagamentosGerenteMensal } from '../manager/manager.service.js'

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
  'commission.gerente',
  'commission.consolidate',
  'notification.send',
  'offer.close',
] as const

export const queues = {
  voucherGenerate: new Queue('voucher.generate', { ...conn(), defaultJobOptions }),
  commissionGerente: new Queue('commission.gerente', { ...conn(), defaultJobOptions }),
  commissionConsolidate: new Queue('commission.consolidate', { ...conn(), defaultJobOptions }),
  notificationSend: new Queue('notification.send', { ...conn(), defaultJobOptions }),
  offerClose: new Queue('offer.close', { ...conn(), defaultJobOptions }),
}

// Job repetitivo (cron nativo do BullMQ) — todo dia 1 às 03h, horário de
// Brasília, consolida a comissão da plataforma do mês que acabou de fechar
// numa Cobranca por conta (ver gerarCobrancasComissaoMensal). jobId fixo faz
// o BullMQ deduplicar — chamar isso de novo em todo boot do servidor não
// cria agendamentos duplicados.
export async function scheduleRecurringJobs() {
  await queues.commissionConsolidate.add(
    'consolidate-monthly',
    {},
    {
      repeat: { pattern: '0 3 1 * *', tz: 'America/Sao_Paulo' },
      jobId: 'commission-consolidate-monthly',
    },
  )
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

  // Consolida o mês que acabou de fechar em duas frentes: comissão da
  // plataforma (Cobranca por conta compradora) e comissão de gerente
  // (PagamentoGerente por gerente) — mesmo mês de referência pras duas, então
  // roda junto no mesmo job. Disparado pelo cron agendado em
  // scheduleRecurringJobs(); aceita `referencia` opcional pra reprocessar um
  // mês específico manualmente (enfileirando o job com esse dado), senão usa
  // a data atual.
  new Worker(
    'commission.consolidate',
    async (job) => {
      const { referencia } = (job.data ?? {}) as { referencia?: string }
      const data = referencia ? new Date(referencia) : new Date()
      await gerarCobrancasComissaoMensal(data)
      await gerarPagamentosGerenteMensal(data)
    },
    conn(),
  )

  // Registra a comissão de gerente da transação, derivada das linhas de
  // ComissaoPlataforma já criadas sincronamente em transaction.service.ts
  // (ver registrarComissoesGerenteDaTransacao).
  new Worker(
    'commission.gerente',
    async (job) => {
      const { transacaoId } = job.data as { transacaoId: string }
      await registrarComissoesGerenteDaTransacao(transacaoId)
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
