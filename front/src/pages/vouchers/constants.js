import { formatDate } from "@/hooks/ListasHook";

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
        id: "descricao",
        accessorKey: 'descricao',
        header: 'Descrição',
    },
    {
        accessorKey: 'criadoEm',
        header: 'Data',
        cell: (value) => value.getValue() ? formatDate(value.getValue()) : '-',
    },
    {
        id: "valor",
        accessorKey: 'valorRT',
        header: 'Valor RT$',
    },
    {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
    },
]
