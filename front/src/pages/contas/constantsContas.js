import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaReal, formatarNumeroParaRT } from "@/utils/functions/formartNumber";
import { filterStart, filterEnd } from "@/utils/functions/tables/date";

const filterIncludesId = (row, columnId, filterValue) => {
    if (!filterValue) return true;
    const ids = row.getValue(columnId);
    return Array.isArray(ids) && ids.includes(filterValue);
};

export const TIPO_LABEL = {
    inscricao: 'Inscrição',
    manutencao: 'Manutenção',
    comissao: 'Comissão',
    outro: 'Outro',
};

export const nomeEntidade = (row) => row.associado?.nome ?? row.agencia?.nome ?? '-';
export const valorCobranca = (row) =>
    row.valorRT != null
        ? `RT$ ${formatarNumeroParaRT(row.valorRT)}`
        : `R$ ${formatarNumeroParaReal(row.valorBRL ?? 0)}`;

// Colunas próprias pra Cobranca — não reaproveita nada de Transação/Voucher
// (que era o que a versão antiga fazia, com campos que não existem em Cobranca).
export const columns = [
    {
        accessorKey: 'conta.numero',
        header: 'Nº Conta',
    },
    {
        id: 'nome',
        accessorFn: nomeEntidade,
        header: 'Nome',
    },
    {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: (info) => TIPO_LABEL[info.getValue()] ?? info.getValue(),
    },
    {
        id: 'valor',
        accessorFn: valorCobranca,
        header: 'Valor',
    },
    {
        accessorKey: 'vencimento',
        header: 'Vencimento',
        cell: (info) => formatDate(info.getValue()),
    },
    {
        accessorKey: 'pago',
        header: 'Status',
        cell: (info) => (info.getValue() ? 'Paga' : 'Pendente'),
    },
    // Colunas ocultas — só alimentam os filtros de ContasSearch.jsx (Associado/Período).
    {
        id: 'associado-filtro',
        accessorFn: (row) => [row.associadoId, row.agenciaId].filter(Boolean),
        header: 'associado-filtro',
        filterFn: filterIncludesId,
    },
    {
        id: 'dataInicio',
        accessorKey: 'vencimento',
        header: 'dataInicio',
        filterFn: filterStart,
    },
    {
        id: 'dataTermino',
        accessorKey: 'vencimento',
        header: 'dataTermino',
        filterFn: filterEnd,
    },
];
