// Calcula a próxima data de vencimento a partir de um dia fixo do mês
// (ex: diaVencimentoFatura do associado). Se o dia já passou neste mês, usa o mês seguinte.
export function calcularVencimento(dia: number): Date {
  const hoje = new Date()
  let vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), dia)
  if (vencimento <= hoje) {
    vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia)
  }
  return vencimento
}

// Constrói uma data num ano/mês específico, "grudando" o dia no último dia do
// mês quando o dia pedido não existe nele (ex: dia 30 em fevereiro -> 28/29).
function diaClamped(ano: number, mes: number, dia: number): Date {
  const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate()
  return new Date(ano, mes, Math.min(dia, ultimoDiaDoMes))
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
  return diaClamped(referencia.getFullYear() + 1, referencia.getMonth(), diaVencimentoFatura)
}
