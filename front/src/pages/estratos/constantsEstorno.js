import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";

// Colunas próprias pra SolicitacaoEstorno — não reaproveita constantsExtratos.js
// (que é pra Transacao/MovimentacaoConta, campos diferentes e ainda quebrados).
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
        accessorKey: 'solicitante.nome',
        header: 'Solicitante',
    },
    {
        accessorKey: 'transacao.tipo',
        header: 'Tipo',
    },
    {
        accessorKey: 'transacao.valorRT',
        header: 'Valor',
        cell: (info) => `RT$ ${formatarNumeroParaRT(info.getValue() ?? 0)}`,
    },
    {
        accessorKey: 'motivo',
        header: 'Motivo',
        cell: (info) => info.getValue() || 'Sem motivo informado',
    },
    {
        accessorKey: 'status',
        header: 'Status',
    },
];
