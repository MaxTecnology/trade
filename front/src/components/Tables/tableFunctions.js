import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";

export const formatColumns = (columns, status) => {
    return columns.map((column) => {
        if (column.accessorKey === 'createdAt') {
            return {
                ...column,
                cell: (value) => formatDate(value.getValue()),
            };
        }
        if (column.accessorKey === 'status' && !status) {
            return {
                ...column,
                cell: (value) => value.getValue() ? "Atendendo" : "Não Atendendo",
            };
        }
        if (column.accessorKey === 'conta.nomeFranquia') {
            return {
                ...column,
                cell: (value) => value.getValue() ? value.getValue() : "Nenhuma Franquia",
            };
        }
        if (column.accessorKey === 'vencimento') {
            return {
                ...column,
                cell: (value) => value.getValue() ? formatDate(value.getValue()) : "Nenhuma data definida",
            };
        }
        if (column.accessorKey === 'tipo') {
            return {
                ...column,
                cell: (value) => value.getValue() ? value.getValue() : "Indefinido",
            };
        }

        if (column.accessorKey === 'valorRt' || column.accessorKey === 'valor' || column.accessorKey === 'valorSolicitado') {
            return {
                ...column,
                cell: (value) => value.getValue() ? `RT$ ${formatarNumeroParaRT(value.getValue())}` : "Indefinido",
            };
        }
        return column;
    });
}