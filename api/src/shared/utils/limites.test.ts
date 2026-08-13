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

import { saldoSuficienteParaDebito } from './limites.js'

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
