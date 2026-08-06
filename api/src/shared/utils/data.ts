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
