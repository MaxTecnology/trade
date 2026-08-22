import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import PaginationTable from "./PaginationTable";
import SortColumn from "./SortColumn";
import { useEffect, useState } from "react";
import filters from "@/store/filters";
import { useSnapshot } from "valtio";

const invisibleFields = ["associado-filtro", "dataInicio", "dataTermino"];

const ContasTable = ({
    columns,
    data,
    setInfo,
    modaltoggle,
    revalidate,
}) => {

    const snap = useSnapshot(filters.table);

    const [columnFilters, setColumnFilters] = useState([])

    const table = useReactTable({
        data,
        columns,
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
                                <th key={header.id} className={invisibleFields.includes(header.column.columnDef.header) ? "hidden" : ""}>
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
                                <td key={cell.id} className={invisibleFields.includes(cell.column.columnDef.header) ? "hidden" : ""}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                            <td className="flex justify-end gap-2">
                                <Buttons
                                    type="Info"
                                    setInfo={setInfo}
                                    info={row.original}
                                    modal={modaltoggle}
                                />
                                {!row.original.pago ? (
                                    <Buttons
                                        type="Quitar"
                                        info={row.original.id}
                                        confirm={"Deseja quitar essa cobrança?"}
                                        titulo={"Cobrança"}
                                        revalidate={revalidate}
                                        resultDelete={"Cobrança quitada com sucesso"}
                                    />
                                ) : null}
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
