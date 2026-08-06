import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";

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
        cell: (value) => value.getValue() ? `RT$ ${formatarNumeroParaRT(value.getValue())}` : "Indefinido",
    },
    {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
    },
]
