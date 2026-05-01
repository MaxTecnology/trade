import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import PaginationTable from "./PaginationTable";
import { formatColumns } from "./tableFunctions";
import SortColumn from "./SortColumn";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import filters from "@/store/filters";

const AgenciasTable = ({
    columns,
    data,
    setId,
    setInfo,
    modaltoggle, type }) => {
    const snap = useSnapshot(filters.table);

    const [columnFilters, setColumnFilters] = useState([])
    const formattedColumns = formatColumns(columns);

    const table = useReactTable({
        data,
        columns: formattedColumns,
        state: {
            columnFilters,
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    useEffect(() => {
        const filters = Object.entries(snap).map(([key, value]) => {
            if (key !== 'search') {
                return {
                    id: key,
                    value: value,
                };
            }
        }).filter(Boolean);

        table.setGlobalFilter(snap?.search);
        setColumnFilters(filters);
    }, [table, snap]);



    return (
        <div className="w-full">
            <table className="w-full border-separate border-spacing-y-1">
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id} width={headerGroup.getSize} className="text-left">
                            {headerGroup.headers.map(header => (
                                <th key={header.id}>
                                    <div className="flex items-center gap-3">
                                        {header.column.columnDef.header}
                                        <SortColumn header={header} />
                                    </div>
                                </th>
                            ))}
                            <th className="text-right">Operação</th>
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="pb-50">
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                            <td className="flex justify-end gap-2">
                                <Buttons
                                    type="Edit"
                                    setId={setId}
                                    setInfo={setInfo}
                                    info={row.original}
                                    value={row.original.idPlano}
                                    modal={modaltoggle}
                                />
                                {type === "Matriz" ?
                                    <Buttons type="Bloq" userId={row.original.idUsuario} />
                                    : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <PaginationTable table={table} />
        </div>
    )
};

export default AgenciasTable;
