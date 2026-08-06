import { filterEnd, filterStart } from "@/utils/functions/tables/date";

export const columns = [
    {
        id: "comprador",
        accessorKey: 'transacao.comprador.nome',
        header: 'Comprador',
    },
    {
        id: "vendedor",
        accessorKey: 'transacao.vendedor.nome',
        header: 'Vendedor',
    },
    {
        accessorKey: 'motivo',
        header: 'Motivo',
    },
    {
        id: 'valor',
        accessorKey: 'transacao.valorRT',
        header: 'Valor RT$',
    },
    {
        header: 'Status',
        accessorKey: 'status',
    },
    {
        accessorKey: 'criadoEm',
        header: 'Data'
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
