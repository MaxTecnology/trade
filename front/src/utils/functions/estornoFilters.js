// Replica os mesmos filtros de constantsEstorno.js (filterIncludes/
// filterIncludesId/filterStart/filterEnd), mas rodando direto sobre o array
// de solicitações — usado pelo "Gerar PDF", que precisa do conjunto
// filtrado fora da tabela (ExtratosSearch.jsx não tem acesso ao
// getFilteredRowModel() de ExtratosTable.jsx). Se os filtros da tabela
// mudarem, atualizar aqui também.
const norm = (v) => String(v ?? '').toLowerCase()

export const applyEstornoFilters = (rows, f = {}) => {
    return rows.filter((r) => {
        if (f.comprador && !norm(r.transacao?.comprador?.nome).includes(norm(f.comprador))) return false
        if (f.vendedor && !norm(r.transacao?.vendedor?.nome).includes(norm(f.vendedor))) return false

        if (f.agencia) {
            const agenciaIds = [
                r.transacao?.comprador?.agenciaId,
                r.transacao?.vendedor?.agenciaId,
                r.transacao?.contaOrigem?.agenciaId,
                r.transacao?.contaDestino?.agenciaId,
            ].filter(Boolean)
            if (!agenciaIds.includes(f.agencia)) return false
        }

        if (f.associado) {
            const associadoIds = [r.transacao?.comprador?.id, r.transacao?.vendedor?.id].filter(Boolean)
            if (!associadoIds.includes(f.associado)) return false
        }

        if (f.dataInicio && new Date(r.criadoEm) < new Date(f.dataInicio)) return false
        if (f.dataTermino && new Date(r.criadoEm) >= new Date(f.dataTermino)) return false

        if (f.search) {
            const haystack = norm([r.id, r.solicitante?.nome, r.transacao?.tipo, r.motivo, r.status].join(' '))
            if (!haystack.includes(norm(f.search))) return false
        }

        return true
    })
}
