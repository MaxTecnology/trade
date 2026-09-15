import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calcularVencimento, proximoVencimentoManutencao } from './data.js'

// Datas de vencimento são meia-noite de Brasília (UTC-3) representada como
// instante UTC (03:00 UTC) — não meia-noite UTC pura. Ver comentário de
// meiaNoiteBrasilia() em data.ts: sem isso, um navegador no fuso do Brasil
// lê a data como o dia anterior (bug corrigido em 2026-09-15).
const brasilia = (ano: number, mes: number, dia: number) => new Date(Date.UTC(ano, mes, dia, 3, 0, 0, 0))

describe('proximoVencimentoManutencao', () => {
  it('sem cobrança anterior, vence 1 ano após o cadastro no dia escolhido', () => {
    const cadastro = brasilia(2026, 2, 15) // 15/mar/2026
    expect(proximoVencimentoManutencao(cadastro, 20)).toEqual(brasilia(2027, 2, 20))
  })

  it('clampa pro último dia do mês quando o dia escolhido não existe (fevereiro)', () => {
    const cadastro = brasilia(2026, 0, 10) // 10/jan/2026
    // referência (cadastro) é janeiro -> +1 ano = janeiro/2027, dia 30 existe em janeiro
    expect(proximoVencimentoManutencao(cadastro, 30)).toEqual(brasilia(2027, 0, 30))
  })

  it('clampa dia 30 em fevereiro (ano não bissexto) pro dia 28', () => {
    const cadastro = brasilia(2025, 1, 5) // 05/fev/2025
    expect(proximoVencimentoManutencao(cadastro, 30)).toEqual(brasilia(2026, 1, 28))
  })

  it('clampa dia 30 em fevereiro de ano bissexto pro dia 29', () => {
    const cadastro = brasilia(2027, 1, 5) // 05/fev/2027 -> +1 ano = fev/2028 (bissexto)
    expect(proximoVencimentoManutencao(cadastro, 30)).toEqual(brasilia(2028, 1, 29))
  })

  it('cobrança anterior paga: próximo vencimento é 1 ano após o vencimento dela, não do cadastro', () => {
    const cadastro = brasilia(2024, 0, 1)
    const ultima = { vencimento: brasilia(2026, 4, 20), pago: true }
    expect(proximoVencimentoManutencao(cadastro, 20, ultima)).toEqual(brasilia(2027, 4, 20))
  })

  it('cobrança anterior em aberto: não avança, continua sendo a pendência atual', () => {
    const cadastro = brasilia(2024, 0, 1)
    const ultima = { vencimento: brasilia(2026, 4, 20), pago: false }
    expect(proximoVencimentoManutencao(cadastro, 20, ultima)).toEqual(brasilia(2026, 4, 20))
  })
})

describe('calcularVencimento', () => {
  // O servidor roda em UTC (Docker) — sem essas datas serem meia-noite de
  // Brasília (não meia-noite UTC pura), um navegador em UTC-3 exibia o dia
  // anterior ao configurado (ex: dia 20 aparecia como 19). Regressão do bug
  // relatado em 2026-09-15.
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('dia ainda não chegou neste mês: vence no dia escolhido deste mês, meia-noite de Brasília', () => {
    vi.setSystemTime(new Date(Date.UTC(2026, 8, 10, 12, 0, 0))) // 10/set/2026 (meio-dia UTC)
    expect(calcularVencimento(20)).toEqual(brasilia(2026, 8, 20))
  })

  it('dia já passou neste mês: vence no dia escolhido do mês seguinte', () => {
    vi.setSystemTime(new Date(Date.UTC(2026, 8, 25, 12, 0, 0))) // 25/set/2026
    expect(calcularVencimento(20)).toEqual(brasilia(2026, 9, 20))
  })

  it('vencimento cai exatamente em dezembro -> janeiro do ano seguinte', () => {
    vi.setSystemTime(new Date(Date.UTC(2026, 11, 25, 12, 0, 0))) // 25/dez/2026
    expect(calcularVencimento(20)).toEqual(brasilia(2027, 0, 20))
  })

  it('perto da virada UTC (23h Brasília = 02h UTC do dia seguinte) ainda considera o dia certo em Brasília', () => {
    // 20/set 23:30 em Brasília = 21/set 02:30 UTC — se o cálculo usasse
    // getUTCFullYear/getUTCMonth "puros" sobre o instante atual sem
    // deslocar pro fuso de Brasília antes, acharia que já é dia 21 em UTC e
    // pularia o mês incorretamente perto da virada do dia.
    vi.setSystemTime(new Date(Date.UTC(2026, 8, 21, 2, 30, 0)))
    expect(calcularVencimento(20)).toEqual(brasilia(2026, 9, 20))
  })
})
