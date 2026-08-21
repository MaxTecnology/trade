import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";
import { StatusTransacaoRelationCell } from "@/utils/functions/tables/statusTransacao";
import { filterStart, filterEnd } from "@/utils/functions/tables/date";
import { iniciadoPorLabel } from "@/utils/functions/tables/iniciadoPor";

// Filtro de texto — substring, case-insensitive, contra o valor já exibido.
const filterIncludes = (row, columnId, filterValue) => {
    if (!filterValue) return true
    const cellValue = row.getValue(columnId)
    return String(cellValue ?? '').toLowerCase().includes(String(filterValue).toLowerCase())
}

// Filtro de "pertence a" — o accessorFn da coluna produz uma lista de ids
// relevantes pra linha; bate se o valor selecionado estiver nessa lista.
const filterIncludesId = (row, columnId, filterValue) => {
    if (!filterValue) return true
    const ids = row.getValue(columnId)
    return Array.isArray(ids) && ids.includes(filterValue)
}

// Colunas próprias pro ledger da própria conta (movimentacao_conta, via
// GET /extrato) — não reaproveita constantsExtratos.js (Transacao/campos
// legados, ainda quebrado).
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
        accessorKey: 'transacao.tipo',
        header: 'Tipo',
        cell: (info) => info.getValue() ?? '-',
    },
    {
        accessorKey: 'tipo',
        header: 'Operação',
        cell: (info) => info.getValue() === 'credito' ? 'Crédito' : 'Débito',
    },
    {
        accessorKey: 'valor',
        header: 'Valor',
        cell: (info) => `RT$ ${formatarNumeroParaRT(info.getValue() ?? 0)}`,
    },
    {
        accessorKey: 'saldoApos',
        header: 'Saldo Após',
        cell: (info) => `RT$ ${formatarNumeroParaRT(info.getValue() ?? 0)}`,
    },
    {
        accessorKey: 'descricao',
        header: 'Descrição',
        cell: (info) => info.getValue() || '-',
    },
    {
        id: 'iniciadoPor',
        accessorFn: (row) => iniciadoPorLabel(row.transacao),
        header: 'Iniciado por',
    },
    {
        accessorKey: 'transacao.status',
        header: 'Status',
        cell: StatusTransacaoRelationCell,
    },
    // Colunas ocultas (ver invisibleFields em ExtratosTable.jsx) — só existem
    // pra alimentar os filtros de ExtratosSearch.jsx (Associado/Agência/
    // Comprador/Vendedor/Período), que aqui não têm coluna visível própria.
    {
        id: 'comprador',
        accessorFn: (row) => row.transacao?.comprador?.nome,
        header: 'comprador-filtro',
        filterFn: filterIncludes,
    },
    {
        id: 'vendedor',
        accessorFn: (row) => row.transacao?.vendedor?.nome,
        header: 'vendedor-filtro',
        filterFn: filterIncludes,
    },
    {
        id: 'agencia',
        accessorFn: (row) => [
            row.transacao?.comprador?.agenciaId,
            row.transacao?.vendedor?.agenciaId,
            row.transacao?.contaOrigem?.agenciaId,
            row.transacao?.contaDestino?.agenciaId,
        ].filter(Boolean),
        header: 'agencia-filtro',
        filterFn: filterIncludesId,
    },
    {
        id: 'associado',
        accessorFn: (row) => [row.transacao?.comprador?.id, row.transacao?.vendedor?.id].filter(Boolean),
        header: 'associado-filtro',
        filterFn: filterIncludesId,
    },
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
];
