// Brasil não tem horário de verão desde 2019 — offset fixo, sem precisar de
// biblioteca de timezone só pra isso (mesma constante de shared/utils/limites.ts).
const OFFSET_BRASILIA_HORAS = -3

/**
 * Meia-noite de Brasília (UTC-3) pro dia/mês/ano dados, como instante UTC —
 * não depende do timezone do servidor (só usa métodos UTC pra construir).
 * Essencial pra "data de vencimento" ser um conceito de calendário (dia X),
 * não um instante que desloca de dia dependendo de quem tá lendo: o servidor
 * roda em UTC, então `new Date(ano, mes, dia)` (hora local do servidor) vira
 * meia-noite UTC — um navegador em Brasília (UTC-3) lê isso como 21h do dia
 * ANTERIOR (`.getDate()` mostra dia-1). Construindo já como 03:00 UTC
 * (meia-noite de Brasília), tanto o front rodando no fuso do Brasil quanto
 * `getUTCDate()`/etc no backend leem o dia certo.
 */
function meiaNoiteBrasilia(ano: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(ano, mes, dia, -OFFSET_BRASILIA_HORAS, 0, 0, 0))
}

// Calcula a próxima data de vencimento a partir de um dia fixo do mês
// (ex: diaVencimentoFatura do associado). Se o dia já passou neste mês, usa o mês seguinte.
export function calcularVencimento(dia: number): Date {
  const agora = new Date()
  const brasilia = new Date(agora.getTime() + OFFSET_BRASILIA_HORAS * 60 * 60 * 1000)
  const ano = brasilia.getUTCFullYear()
  const mes = brasilia.getUTCMonth()
  let vencimento = meiaNoiteBrasilia(ano, mes, dia)
  if (vencimento <= agora) {
    vencimento = meiaNoiteBrasilia(ano, mes + 1, dia)
  }
  return vencimento
}

// Constrói uma data num ano/mês específico, "grudando" o dia no último dia do
// mês quando o dia pedido não existe nele (ex: dia 30 em fevereiro -> 28/29).
function diaClamped(ano: number, mes: number, dia: number): Date {
  const ultimoDiaDoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
  return meiaNoiteBrasilia(ano, mes, Math.min(dia, ultimoDiaDoMes))
}

/**
 * Próximo vencimento da manutenção anual — sempre 1 ano após a última
 * referência (cadastro, se nunca cobrada, ou o vencimento da última cobrança
 * já gerada), no dia fixo escolhido (diaVencimentoFatura). Uma cobrança em
 * aberto (não paga) não avança — continua sendo "a próxima", só some da
 * pendência quando quitada.
 */
export function proximoVencimentoManutencao(
  criadoEm: Date,
  diaVencimentoFatura: number,
  ultimaCobranca?: { vencimento: Date; pago: boolean },
): Date {
  if (ultimaCobranca && !ultimaCobranca.pago) return ultimaCobranca.vencimento

  const referencia = ultimaCobranca ? ultimaCobranca.vencimento : criadoEm
  return diaClamped(referencia.getUTCFullYear() + 1, referencia.getUTCMonth(), diaVencimentoFatura)
}
