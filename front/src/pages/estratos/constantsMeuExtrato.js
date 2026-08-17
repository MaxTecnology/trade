import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";

// Colunas próprias pro ledger da própria conta (movimentacao_conta, via
// GET /extrato) — não reaproveita constantsExtratos.js (Transacao/campos
// legados, ainda quebrado).
export const columns = [
    {
        accessorKey: 'id',
        header: 'Código',
        cell: (info) => info.getValue()?.slice(0, 8),
    },
    {
        accessorKey: 'criadoEm',
        header: 'Data',
        cell: (info) => formatDate(info.getValue()),
    },
    {
        accessorKey: 'transacao.tipo',
        header: 'Tipo',
        cell: (info) => info.getValue() ?? '-',
    },
    {
        accessorKey: 'tipo',
        header: 'Operação',
        cell: (info) => info.getValue() === 'credito' ? 'Crédito' : 'Débito',
    },
    {
        accessorKey: 'valor',
        header: 'Valor',
        cell: (info) => `RT$ ${formatarNumeroParaRT(info.getValue() ?? 0)}`,
    },
    {
        accessorKey: 'saldoApos',
        header: 'Saldo Após',
        cell: (info) => `RT$ ${formatarNumeroParaRT(info.getValue() ?? 0)}`,
    },
    {
        accessorKey: 'descricao',
        header: 'Descrição',
        cell: (info) => info.getValue() || '-',
    },
    {
        accessorKey: 'transacao.status',
        header: 'Status',
        cell: (info) => info.getValue() ?? '-',
    },
];
