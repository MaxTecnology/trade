import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock Prisma to avoid DATABASE_URL requirement for pure function tests
vi.mock('../../config/prisma.js', () => ({
  prisma: {
    conta: { findUnique: vi.fn() },
    movimentacaoConta: { aggregate: vi.fn() },
  },
}))

vi.mock('../errors/AppError.js', () => ({
  Errors: {
    planLimitReached: () => new Error('Plan limit reached'),
    saleLimitTotalReached: () => new Error('Sale limit total reached'),
  },
}))

import { prisma } from '../../config/prisma.js'
import {
  saldoSuficienteParaDebito,
  inicioMesBrasilia,
  getLimiteCreditoDaConta,
  validarLimiteVenda,
} from './limites.js'

const contaFindUnique = vi.mocked(prisma.conta.findUnique)
const movimentacaoAggregate = vi.mocked(prisma.movimentacaoConta.aggregate)

describe('saldoSuficienteParaDebito', () => {
  it('permite débito que deixa o saldo exatamente no limite de crédito', () => {
    // saldo -500, limite 1000, débito de 500 -> saldo final -1000 (exatamente no teto)
    expect(saldoSuficienteParaDebito(-500, 500, 1000)).toBe(true)
  })

  it('bloqueia débito que passaria do limite de crédito', () => {
    // saldo -500, limite 1000, débito de 501 -> saldo final -1001 (passou do teto)
    expect(saldoSuficienteParaDebito(-500, 501, 1000)).toBe(false)
  })

  it('permite débito normal com saldo positivo e limite zero', () => {
    expect(saldoSuficienteParaDebito(1000, 500, 0)).toBe(true)
  })

  it('bloqueia débito que ficaria negativo quando limite de crédito é zero', () => {
    expect(saldoSuficienteParaDebito(100, 200, 0)).toBe(false)
  })

  it('trata limite de crédito null como zero (nenhuma margem)', () => {
    expect(saldoSuficienteParaDebito(0, 1, 0)).toBe(false)
  })
})

describe('inicioMesBrasilia', () => {
  it('retorna o dia 1 às 03:00 UTC (00:00 em Brasília) pra uma data no meio do mês', () => {
    const meioDoMes = new Date('2026-08-15T12:00:00Z')
    expect(inicioMesBrasilia(meioDoMes).toISOString()).toBe('2026-08-01T03:00:00.000Z')
  })

  it('trata 00:00-02:59 UTC do dia 1 como ainda sendo o mês anterior em Brasília', () => {
    // 2026-09-01T02:59:00Z é 2026-08-31T23:59:00 em Brasília (UTC-3) — ainda agosto.
    // Sem o fix, setDate(1)/setHours(0,0,0,0) num servidor em UTC contaria isso
    // como setembro, adiantando o corte de mês em 3h.
    const antesDaMeiaNoiteEmBrasilia = new Date('2026-09-01T02:59:00Z')
    expect(inicioMesBrasilia(antesDaMeiaNoiteEmBrasilia).toISOString()).toBe('2026-08-01T03:00:00.000Z')
  })

  it('trata exatamente 03:00 UTC do dia 1 (meia-noite em Brasília) como início do novo mês', () => {
    const meiaNoiteEmBrasilia = new Date('2026-09-01T03:00:00Z')
    expect(inicioMesBrasilia(meiaNoiteEmBrasilia).toISOString()).toBe('2026-09-01T03:00:00.000Z')
  })

  it('atravessa virada de ano corretamente (dezembro -> janeiro)', () => {
    const inicioDeJaneiro = new Date('2027-01-01T12:00:00Z')
    expect(inicioMesBrasilia(inicioDeJaneiro).toISOString()).toBe('2027-01-01T03:00:00.000Z')
  })
})

describe('getLimiteCreditoDaConta', () => {
  beforeEach(() => {
    contaFindUnique.mockReset()
  })

  it('retorna o limiteCredito da conta', async () => {
    contaFindUnique.mockResolvedValue({ limiteCredito: 1500 } as never)
    expect(await getLimiteCreditoDaConta('conta-1')).toBe(1500)
  })

  it('trata limiteCredito null como zero', async () => {
    contaFindUnique.mockResolvedValue({ limiteCredito: null } as never)
    expect(await getLimiteCreditoDaConta('conta-1')).toBe(0)
  })

  it('trata conta inexistente como zero', async () => {
    contaFindUnique.mockResolvedValue(null)
    expect(await getLimiteCreditoDaConta('conta-inexistente')).toBe(0)
  })
})

describe('validarLimiteVenda', () => {
  beforeEach(() => {
    movimentacaoAggregate.mockReset()
  })

  function mockAgregados(totalMes: number, totalGeral: number) {
    movimentacaoAggregate
      .mockResolvedValueOnce({ _sum: { valor: totalMes } } as never)
      .mockResolvedValueOnce({ _sum: { valor: totalGeral } } as never)
  }

  it('permite operação dentro dos dois limites', async () => {
    mockAgregados(1000, 5000)
    await expect(
      validarLimiteVenda({
        contaId: 'conta-1',
        valorNovaOperacao: 500,
        limiteVendaMensal: 2000,
        limiteVendaTotal: 10000,
      }),
    ).resolves.toBeUndefined()
  })

  it('bloqueia quando estoura o limite mensal', async () => {
    mockAgregados(1800, 5000)
    await expect(
      validarLimiteVenda({
        contaId: 'conta-1',
        valorNovaOperacao: 500,
        limiteVendaMensal: 2000,
        limiteVendaTotal: 10000,
      }),
    ).rejects.toThrow('Plan limit reached')
  })

  it('bloqueia quando estoura o limite total mesmo dentro do limite mensal', async () => {
    mockAgregados(100, 9800)
    await expect(
      validarLimiteVenda({
        contaId: 'conta-1',
        valorNovaOperacao: 500,
        limiteVendaMensal: 2000,
        limiteVendaTotal: 10000,
      }),
    ).rejects.toThrow('Sale limit total reached')
  })

  it('trata agregados nulos (sem movimentação ainda) como zero', async () => {
    mockAgregados(null as unknown as number, null as unknown as number)
    await expect(
      validarLimiteVenda({
        contaId: 'conta-1',
        valorNovaOperacao: 500,
        limiteVendaMensal: 2000,
        limiteVendaTotal: 10000,
      }),
    ).resolves.toBeUndefined()
  })

  it('permite operação que fica exatamente no teto mensal', async () => {
    mockAgregados(1500, 1500)
    await expect(
      validarLimiteVenda({
        contaId: 'conta-1',
        valorNovaOperacao: 500,
        limiteVendaMensal: 2000,
        limiteVendaTotal: 10000,
      }),
    ).resolves.toBeUndefined()
  })
})
