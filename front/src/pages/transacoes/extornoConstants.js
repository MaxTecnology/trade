import { filterEnd, filterStart } from "@/utils/functions/tables/date";
import { compradorLabel, vendedorLabel } from "@/utils/functions/tables/compradorVendedor";

export const columns = [
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
        accessorKey: 'motivo',
        header: 'Motivo',
    },
    {
        id: 'valor',
        accessorKey: 'transacao.valorRT',
        header: 'Valor RT$',
    },
    {
        header: 'Status',
        accessorKey: 'status',
    },
    {
        accessorKey: 'criadoEm',
        header: 'Data'
    },
    {
        id: 'dataInicio',
        accessorKey: 'criadoEm',
        header: 'dataInicio',
        filterFn: filterStart,
    },
    {
        id: "dataTermino",
        accessorKey: 'criadoEm',
        header: 'dataTermino',
        filterFn: filterEnd,
    },
]
