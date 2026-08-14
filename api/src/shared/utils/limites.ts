import { prisma } from '../../config/prisma.js'
import { Errors } from '../errors/AppError.js'

// Brasil não tem horário de verão desde 2019 — offset fixo, sem precisar de
// biblioteca de timezone só pra isso.
const OFFSET_BRASILIA_HORAS = -3

/**
 * Início do mês corrente no horário de Brasília (UTC-3), como instante UTC.
 * Não depende do timezone do servidor (calcula tudo via métodos UTC) —
 * comparar `criadoEm >= inicioMesBrasilia()` sempre reflete o "mês" como o
 * negócio entende, mesmo rodando num container em UTC.
 */
export function inicioMesBrasilia(agora: Date = new Date()): Date {
  const brasilia = new Date(agora.getTime() + OFFSET_BRASILIA_HORAS * 60 * 60 * 1000)
  const ano = brasilia.getUTCFullYear()
  const mes = brasilia.getUTCMonth()
  // Dia 1 às 00:00 em Brasília (UTC-3) = dia 1 às 03:00 UTC.
  return new Date(Date.UTC(ano, mes, 1, -OFFSET_BRASILIA_HORAS, 0, 0, 0))
}

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
    select: { limiteCredito: true },
  })
  return Number(conta?.limiteCredito ?? 0)
}

export async function validarLimiteVenda(params: {
  contaId: string
  valorNovaOperacao: number
  limiteVendaMensal: number
  limiteVendaTotal: number
}): Promise<void> {
  const { contaId, valorNovaOperacao, limiteVendaMensal, limiteVendaTotal } = params

  const inicioMes = inicioMesBrasilia()

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
    throw Errors.saleLimitTotalReached()
  }
}
