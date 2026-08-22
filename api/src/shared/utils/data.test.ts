import { describe, expect, it } from 'vitest'
import { proximoVencimentoManutencao } from './data.js'

describe('proximoVencimentoManutencao', () => {
  it('sem cobrança anterior, vence 1 ano após o cadastro no dia escolhido', () => {
    const cadastro = new Date(2026, 2, 15) // 15/mar/2026
    expect(proximoVencimentoManutencao(cadastro, 20)).toEqual(new Date(2027, 2, 20))
  })

  it('clampa pro último dia do mês quando o dia escolhido não existe (fevereiro)', () => {
    const cadastro = new Date(2026, 0, 10) // 10/jan/2026
    // referência (cadastro) é janeiro -> +1 ano = janeiro/2027, dia 30 existe em janeiro
    expect(proximoVencimentoManutencao(cadastro, 30)).toEqual(new Date(2027, 0, 30))
  })

  it('clampa dia 30 em fevereiro (ano não bissexto) pro dia 28', () => {
    const cadastro = new Date(2025, 1, 5) // 05/fev/2025
    expect(proximoVencimentoManutencao(cadastro, 30)).toEqual(new Date(2026, 1, 28))
  })

  it('clampa dia 30 em fevereiro de ano bissexto pro dia 29', () => {
    const cadastro = new Date(2027, 1, 5) // 05/fev/2027 -> +1 ano = fev/2028 (bissexto)
    expect(proximoVencimentoManutencao(cadastro, 30)).toEqual(new Date(2028, 1, 29))
  })

  it('cobrança anterior paga: próximo vencimento é 1 ano após o vencimento dela, não do cadastro', () => {
    const cadastro = new Date(2024, 0, 1)
    const ultima = { vencimento: new Date(2026, 4, 20), pago: true }
    expect(proximoVencimentoManutencao(cadastro, 20, ultima)).toEqual(new Date(2027, 4, 20))
  })

  it('cobrança anterior em aberto: não avança, continua sendo a pendência atual', () => {
    const cadastro = new Date(2024, 0, 1)
    const ultima = { vencimento: new Date(2026, 4, 20), pago: false }
    expect(proximoVencimentoManutencao(cadastro, 20, ultima)).toEqual(new Date(2026, 4, 20))
  })
})
