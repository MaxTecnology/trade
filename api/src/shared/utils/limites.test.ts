import { describe, expect, it, vi } from 'vitest'

// Mock Prisma to avoid DATABASE_URL requirement for pure function tests
vi.mock('../../config/prisma.js', () => ({
  prisma: {},
}))

vi.mock('../errors/AppError.js', () => ({
  Errors: {
    planLimitReached: () => new Error('Plan limit reached'),
  },
}))

import { saldoSuficienteParaDebito, inicioMesBrasilia } from './limites.js'

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
