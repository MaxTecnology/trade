import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { formatDate } from "../../hooks/ListasHook";
import { formatarNumeroParaReal } from "../../utils/functions/formartNumber";
import PaginationTable from "./PaginationTable";
import SortColumn from "./SortColumn";
import { TIPO_LABEL } from "@/pages/relatorios/constantsManutencaoAnual";

const ManutencaoAnualTable = ({ columns, data }) => {
    const formattedColumns = columns.map((column) => {
        if (column.accessorKey === 'tipo') {
            return {
                ...column,
                cell: (value) => TIPO_LABEL[value.getValue()] ?? value.getValue(),
            };
        }
        if (column.accessorKey === 'valorManutencao') {
            return {
                ...column,
                cell: (value) => `R$ ${formatarNumeroParaReal(Number(value.getValue()))}`,
            };
        }
        if (column.accessorKey === 'proximoVencimento') {
            return {
                ...column,
                cell: (value) => formatDate(value.getValue()),
            };
        }
        if (column.accessorKey === 'situacao') {
            return {
                ...column,
                cell: (value) => {
                    const row = value.row.original;
                    if (!row.emAberto) return <span className="text-green-600">Em dia</span>;
                    if (row.diasAtraso > 0) return <span className="text-red-600">Atrasado ({row.diasAtraso} dias)</span>;
                    return <span className="text-amber-600">Cobrança gerada</span>;
                },
            };
        }
        return column;
    });

    const table = useReactTable({
        data,
        columns: formattedColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="w-full">
            <table className="w-full border-separate border-spacing-y-1">
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id} className="text-left">
                            {headerGroup.headers.map(header => (
                                <th key={header.id}>
                                    <div className="flex items-center gap-3">
                                        {header.column.columnDef.header}
                                        <SortColumn header={header} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <PaginationTable table={table} />
        </div>
    );
};

export default ManutencaoAnualTable;
