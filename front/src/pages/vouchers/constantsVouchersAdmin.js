import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";
import { compradorLabel, vendedorLabel } from "@/utils/functions/tables/compradorVendedor";

// Linhas aqui são Voucher (não Transacao) — GET /vouchers retorna
// {id, codigo, emitidoEm, transacao: {...}}, diferente de constants.js
// (usado em Meus Vouchers/Solicitar Cancelamento, que lista Transacao direto).
export const columns = [
    {
        id: "codigo",
        accessorKey: 'codigo',
        header: 'Código',
        cell: (info) => info.getValue()?.slice(0, 8) ?? '-',
    },
    {
        id: "comprador",
        accessorFn: (row) => compradorLabel(row.transacao),
        header: 'Comprador',
    },
    {
        id: "vendedor",
        accessorFn: (row) => vendedorLabel(row.transacao),
        header: 'Vendedor',
    },
    {
        id: "criadoEm",
        accessorKey: 'emitidoEm',
        header: 'Data',
        cell: (info) => info.getValue() ? formatDate(info.getValue()) : '-',
    },
    {
        id: "valor",
        accessorFn: (row) => row.transacao?.valorRT,
        header: 'Valor RT$',
        cell: (info) => info.getValue() ? `RT$ ${formatarNumeroParaRT(info.getValue())}` : "Indefinido",
    },
    {
        id: 'status',
        accessorFn: (row) => row.transacao?.status,
        header: 'Status',
    },
]
