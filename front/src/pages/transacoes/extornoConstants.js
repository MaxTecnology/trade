import { filterEnd, filterStart } from "@/utils/functions/tables/date";

export const columns = [
    {
        id: "comprador",
        accessorKey: 'nomeComprador',
        header: 'Comprador',
    },
    {
        id: "vendedor",
        accessorKey: 'nomeVendedor',
        header: 'Vendedor',
    },
    {
        accessorKey: 'descricao',
        header: 'Descrição',
    },
    {
        accessorKey: 'createdAt',
        header: 'Data'
    },
    {
        accessorKey: 'valorRt',
        header: 'Valor RT$',
    },
    {
        accessorKey: 'status',
        header: 'Status',
    },
    {
        id: 'agencia',
        accessorKey: 'conta.nomeFranquia',
        header: 'Agência',
    },
    {
        id: 'dataInicio',
        accessorKey: 'createdAt',
        header: 'dataInicio',
        filterFn: filterStart,
    },
    {
        id: "dataTermino",
        accessorKey: 'createdAt',
        header: 'dataTermino',
        filterFn: filterEnd,
    },
]