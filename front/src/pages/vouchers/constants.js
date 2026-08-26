import { formatDate } from "@/hooks/ListasHook";
import { compradorLabel, vendedorLabel } from "@/utils/functions/tables/compradorVendedor";

export const columns = [
    {
        id: "comprador",
        accessorFn: compradorLabel,
        header: 'Comprador',
    },
    {
        id: "vendedor",
        accessorFn: vendedorLabel,
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
