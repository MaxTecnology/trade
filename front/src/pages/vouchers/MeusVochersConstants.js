import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";

export const columns = [
    {
        id: "comprador",
        accessorKey: 'transacao.comprador.nomeFantasia',
        header: 'Comprador',
    },
    {
        id: "vendedor",
        accessorKey: 'transacao.vendedor.nomeFantasia',
        header: 'Vendedor',
    },
    {
        id: "descricao",
        accessorKey: 'transacao.descricao',
        header: 'Descrição',
    },
    {
        accessorKey: 'transacao.createdAt',
        header: 'Data',
        cell: (value) => formatDate(value.getValue()),
    },
    {
        id: "valor",
        accessorKey: 'transacao.valorRt',
        header: 'Valor RT$',
        cell: (value) => value.getValue() ? `RT$ ${formatarNumeroParaRT(value.getValue())}` : "Indefinido",
    },
    {
        id: 'status',
        accessorKey: 'transacao.status',
        header: 'Status',
    },
    {
        id: 'agencia',
        accessorKey: 'transacao.vendedor.conta.nomeFranquia',
        header: 'Agência',
    }
]