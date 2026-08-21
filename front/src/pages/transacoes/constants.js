import { filterEnd, filterStart } from "@/utils/functions/tables/date";
import { StatusTransacaoCell } from "@/utils/functions/tables/statusTransacao";
import { iniciadoPorLabel } from "@/utils/functions/tables/iniciadoPor";

export const columns = [
    {
        id: "comprador",
        accessorKey: 'comprador.nome',
        header: 'Comprador',
    },
    {
        id: "vendedor",
        accessorKey: 'vendedor.nome',
        header: 'Vendedor',
    },
    {
        accessorKey: 'descricao',
        header: 'Descrição',
    },
    {
        accessorKey: 'criadoEm',
        header: 'Data'
    },
    {
        accessorKey: 'valorRT',
        header: 'Valor RT$',
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
    {
        id: 'agencia',
        accessorKey: 'conta.nomeFranquia',
        header: 'Agência',
    },
    {
        id: 'dataInicio',
        accessorKey: 'criadoEm',
        header: 'dataInicio',
        filterFn: filterStart,
    },
    {
        id: "dataTermino",
        accessorKey: 'criadoEm',
        header: 'dataTermino',
        filterFn: filterEnd,
    },
]