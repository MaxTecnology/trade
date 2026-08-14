import { Queue, Worker, QueueEvents } from 'bullmq'
import { getRedis } from '../../config/redis.js'
import { prisma } from '../../config/prisma.js'
import { calcularVencimento } from '../../shared/utils/data.js'

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
      if (!transacao || !transacao.comissaoBRL || Number(transacao.comissaoBRL) <= 0) return
      if (!transacao.contaOrigemId) return

      const contaOrigem = await prisma.conta.findUnique({
        where: { id: transacao.contaOrigemId },
        include: { associado: true, agencia: true },
      })
      if (!contaOrigem) return

      // A comissão calculada (comissaoBRL) só ficava guardada na própria transação, sem
      // nenhum jeito de efetivamente ser cobrada de alguém. Vira uma Cobrança BRL no
      // comprador, vinculada à transação, seguindo o mesmo padrão de cobrança de inscrição.
      const jaExiste = await prisma.cobranca.findFirst({ where: { transacaoId } })
      if (jaExiste) return

      const diaVencimentoFatura =
        contaOrigem.associado?.diaVencimentoFatura ?? contaOrigem.agencia?.diaVencimentoFatura ?? 10
      const vencimento = calcularVencimento(diaVencimentoFatura)

      // Conta.agenciaId só é preenchido quando a própria conta pertence a uma Agência
      // (entityType: 'agencia'). Pra conta de Associado, a agência que gerencia o associado
      // vem de Associado.agenciaId — mesmo padrão usado na cobrança de inscrição
      // (associate.service.ts).
      const agenciaId =
        contaOrigem.entityType === 'associado'
          ? (contaOrigem.associado?.agenciaId ?? null)
          : contaOrigem.entityType === 'agencia'
            ? contaOrigem.agenciaId
            : null

      await prisma.cobranca.create({
        data: {
          descricao: `Comissão da plataforma — transação #${transacaoId.slice(0, 8)}`,
          valorBRL: transacao.comissaoBRL,
          vencimento,
          contaId: transacao.contaOrigemId,
          associadoId: contaOrigem.associadoId,
          agenciaId,
          transacaoId,
        },
      })
    },
    conn(),
  )

  new Worker(
    'commission.gerente',
    async (job) => {
      const { transacaoId } = job.data as { transacaoId: string }
      const transacao = await prisma.transacao.findUnique({ where: { id: transacaoId } })
      if (!transacao?.contaOrigemId) return

      const contaOrigem = await prisma.conta.findUnique({
        where: { id: transacao.contaOrigemId },
        include: { associado: { include: { gerente: true } } },
      })

      // Comissão de gerente só existe quando quem comprou é um Associado cadastrado
      // por um gerente — Agência e Matriz nunca geram essa comissão.
      if (contaOrigem?.entityType !== 'associado') return
      if (!contaOrigem.associado?.gerenteId || !contaOrigem.associado.gerente) return

      const gerente = contaOrigem.associado.gerente
      if (!gerente.percentualComissao) return

      // Opção A: comissão é X% do valor RT da transação
      const comissaoRT =
        Number(transacao.valorRT) * (Number(gerente.percentualComissao) / 100)

      await prisma.comissaoGerente.create({
        data: {
          gerenteId: gerente.id,
          associadoId: contaOrigem.associado.id,
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
