// Replica o filtro de Período de constantsMeuExtrato.js (filterStart/
// filterEnd), rodando direto sobre o array de movimentações — usado pelo
// "Gerar PDF", que precisa do conjunto filtrado fora da tabela
// (ExtratosSearch.jsx não tem acesso ao getFilteredRowModel() de
// ExtratosTable.jsx). Associado/Agência/Comprador/Vendedor não se aplicam
// ao próprio extrato (é sempre a mesma conta) — ExtratosSearch.jsx mostra
// esses campos por ser um componente genérico, mas eles não filtram nada
// aqui, igual na tabela.
const norm = (v) => String(v ?? '').toLowerCase()

export const applyMeuExtratoFilters = (rows, f = {}) => {
    return rows.filter((r) => {
        if (f.dataInicio && new Date(r.criadoEm) < new Date(f.dataInicio)) return false
        if (f.dataTermino && new Date(r.criadoEm) >= new Date(f.dataTermino)) return false

        if (f.search) {
            const haystack = norm([r.id, r.transacao?.tipo, r.tipo, r.descricao].join(' '))
            if (!haystack.includes(norm(f.search))) return false
        }

        return true
    })
}
