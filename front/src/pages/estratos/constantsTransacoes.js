import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";
import { filterStart, filterEnd } from "@/utils/functions/tables/date";

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
        accessorKey: 'comprador.nome',
        header: 'Comprador',
        cell: (info) => info.getValue() ?? '-',
    },
    {
        accessorKey: 'vendedor.nome',
        header: 'Vendedor',
        cell: (info) => info.getValue() ?? '-',
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
    // pra alimentar o filtro de Período (ExtratosSearch escreve dataInicio/
    // dataTermino em filters.table, casado com o id destas colunas).
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
