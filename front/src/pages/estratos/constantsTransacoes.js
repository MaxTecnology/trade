import { formatDateHora } from "@/hooks/ListasHook";
import { formatarNumeroParaRT, formatarNumeroParaReal } from "@/utils/functions/formartNumber";
import { filterStart, filterEnd } from "@/utils/functions/tables/date";
import { StatusTransacaoCell } from "@/utils/functions/tables/statusTransacao";
import { iniciadoPorLabel } from "@/utils/functions/tables/iniciadoPor";
import { compradorLabel, vendedorLabel } from "@/utils/functions/tables/compradorVendedor";

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
        cell: (info) => formatDateHora(info.getValue()),
    },
    {
        accessorKey: 'tipo',
        header: 'Tipo',
    },
    {
        id: 'comprador',
        accessorFn: compradorLabel,
        header: 'Comprador',
        filterFn: filterIncludes,
    },
    {
        id: 'vendedor',
        accessorFn: vendedorLabel,
        header: 'Vendedor',
        filterFn: filterIncludes,
    },
    {
        accessorKey: 'valorRT',
        header: 'Valor',
        cell: (info) => `RT$ ${formatarNumeroParaRT(info.getValue() ?? 0)}`,
    },
    {
        // Substitui o antigo campo único Transacao.comissaoBRL (removido em
        // 2026-09-18) — soma as linhas ativas de ComissaoPlataforma da
        // transação (pode ter uma do comprador, uma do vendedor, ou as duas).
        id: 'comissao',
        accessorFn: (row) => (row.comissoesPlataforma ?? []).reduce((soma, c) => soma + Number(c.comissaoBRL ?? 0), 0),
        header: 'Comissão',
        cell: (info) => (info.getValue() > 0 ? `R$ ${formatarNumeroParaReal(info.getValue())}` : '-'),
    },
    {
        id: 'iniciadoPor',
        accessorFn: iniciadoPorLabel,
        header: 'Iniciado por',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: StatusTransacaoCell,
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
