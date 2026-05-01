import { filterEnd, filterStart } from "@/utils/functions/tables/date";

export const columns = [
    {
        accessorKey: 'idTransacao',
        header: 'Código',
    },
    {
        accessorKey: 'createdAt',
        header: 'Data',
    },
    {
        accessorKey: 'nomeComprador',
        header: 'Associado',
    },
    // {
    //     accessorKey: 'createdAt',
    //     header: 'Origem',
    // },
    {
        accessorKey: 'saldoAnteriorComprador',
        header: 'Saldo Anterior RT$',
    },
    {
        accessorKey: 'status',
        header: 'Status',
    },
    // {
    //     accessorKey: 'status',
    //     header: 'Operação RT$',
    // },
    {
        accessorKey: 'comissao',
        header: 'Comissão',
    },
    {
        accessorKey: 'saldoAposComprador',
        header: 'Saldo RT$',
    },
    {
        id: 'agencia',
        accessorKey: 'conta.nomeFranquia',
        header: 'Agência',
    },
    {
        accessorKey: 'nomeVendedor',
        header: 'Vendedor',
    },
    // {
    //     accessorKey: 'nomeComprador',
    //     header: 'Comprador',
    // },
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