import { Queue, Worker, QueueEvents } from 'bullmq'
import { getRedis } from '../../config/redis.js'
import { prisma } from '../../config/prisma.js'
import { gerarCobrancasComissaoDoDia } from '../cobranca/cobranca.service.js'
import { registrarComissoesGerenteDaTransacao, gerarPagamentosGerenteDoDia } from '../manager/manager.service.js'

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

// Job repetitivo (cron nativo do BullMQ) — TODO DIA às 03h, horário de
// Brasília, fecha comissão da plataforma + comissão de gerente por conta
// (cada conta fecha no seu próprio diaVencimentoFatura, não mais um dia 1
// fixo pra todo mundo — decisão de produto 2026-09-26; ver
// gerarCobrancasComissaoDoDia/gerarPagamentosGerenteDoDia). jobId fixo faz o
// BullMQ deduplicar — chamar isso de novo em todo boot do servidor não cria
// agendamentos duplicados.
export async function scheduleRecurringJobs() {
  // Remove o agendamento mensal antigo (jobId mudou de -monthly pra -daily,
  // então o BullMQ não substitui sozinho — sem isso o job de dia 1 continua
  // rodando em paralelo com o novo diário).
  const repetiveis = await queues.commissionConsolidate.getRepeatableJobs()
  for (const job of repetiveis) {
    if (job.id === 'commission-consolidate-monthly') {
      await queues.commissionConsolidate.removeRepeatableByKey(job.key)
    }
  }

  await queues.commissionConsolidate.add(
    'consolidate-daily',
    {},
    {
      repeat: { pattern: '0 3 * * *', tz: 'America/Sao_Paulo' },
      jobId: 'commission-consolidate-daily',
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

  // Roda todo dia, em duas frentes: fecha a comissão da plataforma de cada
  // conta cujo diaVencimentoFatura bate com hoje (Cobranca por conta) e
  // consolida a comissão de gerente elegível (associado pagou + 2 dias do
  // vencimento dele — ver gerarPagamentosGerenteDoDia). Disparado pelo cron
  // agendado em scheduleRecurringJobs(); aceita `referencia` opcional pra
  // reprocessar um dia específico manualmente (enfileirando o job com esse
  // dado), senão usa a data atual.
  new Worker(
    'commission.consolidate',
    async (job) => {
      const { referencia } = (job.data ?? {}) as { referencia?: string }
      const data = referencia ? new Date(referencia) : new Date()
      await gerarCobrancasComissaoDoDia(data)
      await gerarPagamentosGerenteDoDia(data)
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
