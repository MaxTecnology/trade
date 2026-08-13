import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../errors/AppError.js'

export function saldoSuficienteParaDebito(
  saldoAtual: number,
  valorDebito: number,
  limiteCredito: number,
): boolean {
  return saldoAtual - valorDebito >= -limiteCredito
}

export async function getLimiteCreditoDaConta(contaId: string): Promise<number> {
  const conta = await prisma.conta.findUnique({
    where: { id: contaId },
    select: {
      associado: { select: { limiteCredito: true } },
      agencia: { select: { limiteCredito: true } },
    },
  })
  const limite = conta?.associado?.limiteCredito ?? conta?.agencia?.limiteCredito ?? 0
  return Number(limite)
}

export async function validarLimiteVenda(params: {
  contaId: string
  valorNovaOperacao: number
  limiteVendaMensal: number
  limiteVendaTotal: number
}): Promise<void> {
  const { contaId, valorNovaOperacao, limiteVendaMensal, limiteVendaTotal } = params

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [mesAgg, totalAgg] = await Promise.all([
    prisma.movimentacaoConta.aggregate({
      where: { contaId, tipo: 'debito', criadoEm: { gte: inicioMes } },
      _sum: { valor: true },
    }),
    prisma.movimentacaoConta.aggregate({
      where: { contaId, tipo: 'debito' },
      _sum: { valor: true },
    }),
  ])

  const totalMes = Number(mesAgg._sum.valor ?? 0)
  const totalGeral = Number(totalAgg._sum.valor ?? 0)

  if (totalMes + valorNovaOperacao > limiteVendaMensal) throw Errors.planLimitReached()
  if (totalGeral + valorNovaOperacao > limiteVendaTotal) {
    throw new AppError('PLAN_LIMIT_REACHED', 'Limite total de venda atingido.', 422)
  }
}
