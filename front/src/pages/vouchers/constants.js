import { formatDate } from "@/hooks/ListasHook";

export const columns = [
    {
        id: "comprador",
        accessorKey: 'comprador.nomeFantasia',
        header: 'Comprador',
    },
    {
        id: "vendedor",
        accessorKey: 'vendedor.nomeFantasia',
        header: 'Vendedor',
    },
    {
        id: "descricao",
        accessorKey: 'descricao',
        header: 'Descrição',
    },
    {
        accessorKey: 'createdAt',
        header: 'Data',
        cell: (value) => formatDate(value.getValue()),
    },
    {
        id: "valor",
        accessorKey: 'valorRt',
        header: 'Valor RT$',
    },
    {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
    },
    {
        id: 'agencia',
        accessorKey: 'vendedor.conta.nomeFranquia',
        header: 'Agência',
    }
]