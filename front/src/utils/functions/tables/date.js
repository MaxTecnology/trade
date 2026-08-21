const pad = (n) => String(n).padStart(2, '0')
const toDateInputValue = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Período padrão do mês atual (dia 1 até hoje) — usado como valor inicial
// dos filtros de Período em ExtratosSearch.jsx. Datas locais, não UTC, pra
// bater com o que o <input type="date"> mostra pro usuário.
export const currentMonthRange = () => {
    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return { dataInicio: toDateInputValue(firstOfMonth), dataTermino: toDateInputValue(today) }
}

export const filterStart = (row, columnId, filterStatuses) => {
    // Sem valor (campo de data limpo) = sem filtro. Date.parse("") é NaN, e
    // qualquer comparação com NaN é sempre false — sem essa guarda,
    // "cellDate >= NaN" nunca bate e a tabela some inteira ao limpar a data.
    if (!filterStatuses) return true;
    const cellDate = Date.parse(row.getValue(columnId));
    const filterDate = Date.parse(filterStatuses);
    if (cellDate >= filterDate) {
        return true;
    }
    return false
};
export const filterEnd = (row, columnId, filterStatuses) => {
    if (!filterStatuses) return true;
    const cellDate = Date.parse(row.getValue(columnId));
    // dataTermino é o dia inteiro (inclusive) — o <input type="date"> vira
    // meia-noite UTC daquele dia, então sem somar 1 dia aqui, qualquer coisa
    // criada no próprio dia escolhido (ex: "hoje") fica de fora.
    const filterDateEndOfDay = Date.parse(filterStatuses) + 24 * 60 * 60 * 1000;
    if (cellDate >= filterDateEndOfDay) {
        return false;
    }
    return true
};