import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";
import { filterStart, filterEnd } from "@/utils/functions/tables/date";

// Filtro de texto — substring, case-insensitive, contra o valor já exibido.
const filterIncludes = (row, columnId, filterValue) => {
    if (!filterValue) return true
    const cellValue = row.getValue(columnId)
    return String(cellValue ?? '').toLowerCase().includes(String(filterValue).toLowerCase())
}

// Filtro de "pertence a" — o accessorFn da coluna produz uma lista de ids
// relevantes pra linha (ex: agências envolvidas, associados envolvidos);
// bate se o valor selecionado estiver nessa lista.
const filterIncludesId = (row, columnId, filterValue) => {
    if (!filterValue) return true
    const ids = row.getValue(columnId)
    return Array.isArray(ids) && ids.includes(filterValue)
}

// Colunas pra visão ampla de transações (Transacao, via GET /relatorios/permutas
// sem filtro de tipo) — não reaproveita constantsExtratos.js (campos legados,
// ainda quebrado) nem constantsMeuExtrato.js (ledger por conta, granularidade
// diferente: por parcela, não por transação).
export const columns = [
    {
        accessorKey: 'id',
        header: 'Código',
        cell: (info) => info.getValue()?.slice(0, 8),
    },
    {
        accessorKey: 'criadoEm',
        header: 'Data',
        cell: (info) => formatDate(info.getValue()),
    },
    {
        accessorKey: 'tipo',
        header: 'Tipo',
    },
    {
        id: 'comprador',
        accessorKey: 'comprador.nome',
        header: 'Comprador',
        cell: (info) => info.getValue() ?? '-',
        filterFn: filterIncludes,
    },
    {
        id: 'vendedor',
        accessorKey: 'vendedor.nome',
        header: 'Vendedor',
        cell: (info) => info.getValue() ?? '-',
        filterFn: filterIncludes,
    },
    {
        accessorKey: 'valorRT',
        header: 'Valor',
        cell: (info) => `RT$ ${formatarNumeroParaRT(info.getValue() ?? 0)}`,
    },
    {
        accessorKey: 'comissaoBRL',
        header: 'Comissão',
        cell: (info) => info.getValue() ? `R$ ${formatarNumeroParaRT(info.getValue())}` : '-',
    },
    {
        accessorKey: 'status',
        header: 'Status',
    },
    // Colunas ocultas (ver invisibleFields em ExtratosTable.jsx) — só existem
    // pra alimentar filtros que não têm coluna visível própria.
    {
        id: 'dataInicio',
        accessorKey: 'criadoEm',
        header: 'dataInicio',
        filterFn: filterStart,
    },
    {
        id: 'dataTermino',
        accessorKey: 'criadoEm',
        header: 'dataTermino',
        filterFn: filterEnd,
    },
    {
        id: 'agencia',
        // Agência que gerencia o comprador/vendedor (Associado.agenciaId), ou a
        // própria Agência quando ela é a parte direta (contaOrigem/contaDestino).
        accessorFn: (row) => [
            row.comprador?.agenciaId,
            row.vendedor?.agenciaId,
            row.contaOrigem?.agenciaId,
            row.contaDestino?.agenciaId,
        ].filter(Boolean),
        header: 'agencia-filtro',
        filterFn: filterIncludesId,
    },
    {
        id: 'associado',
        accessorFn: (row) => [row.comprador?.id, row.vendedor?.id].filter(Boolean),
        header: 'associado-filtro',
        filterFn: filterIncludesId,
    },
];
