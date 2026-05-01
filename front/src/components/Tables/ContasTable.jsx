import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import { formatDate } from "../../hooks/ListasHook";
import PaginationTable from "./PaginationTable";
import SortColumn from "./SortColumn";
import { useEffect, useState } from "react";
import filters from "@/store/filters";
import { useSnapshot } from "valtio";

const ContasTable = ({
    columns,
    data,
    setInfo,
    modaltoggle,
}) => {

    const snap = useSnapshot(filters.table);

    const [columnFilters, setColumnFilters] = useState([])

    const formattedColumns = columns.map((column) => {
        if (column.accessorKey === 'createdAt') {
            return {
                ...column,
                cell: (value) => formatDate(value.getValue()),
            };
        }
        if (column.accessorKey === 'conta.nomeFranquia') {
            return {
                ...column,
                cell: (value) => value.getValue() ? value.getValue() : "Nenhuma Franquia",
            };
        }
        if (column.accessorKey === 'tipo') {
            return {
                ...column,
                cell: (value) => value.getValue() ? value.getValue() : "Indefinido",
            };
        }
        if (column.accessorKey === 'vencimentoFatura') {
            return {
                ...column,
                cell: (value) => value.getValue() ? formatDate(value.getValue()) : "Indefinido",
            };
        }
        return column;
    });
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

    const invisibleFields = []

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
                                    type="Info"
                                    setId={() => { }}
                                    setInfo={setInfo}
                                    info={row.original}
                                    value={row.original.idPlano}
                                    modal={modaltoggle}
                                />
                                <Buttons
                                    type="Quitar"
                                    info={row.original.idCobranca}
                                    confirm={"Deseja quitar essa conta?"}
                                    titulo={"Conta"}
                                    revalidate={() => { }}
                                    resultDelete={"Conta quitada com sucesso"}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <PaginationTable table={table} />
        </div>
    )
};

export default ContasTable;
