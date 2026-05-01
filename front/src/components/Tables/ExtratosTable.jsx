import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import { formatDate } from "../../hooks/ListasHook";
import PaginationTable from "./PaginationTable";
import SortColumn from "./SortColumn";
import { useEffect, useState } from "react";
import filters from "@/store/filters";
import { useSnapshot } from "valtio";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";

const ExtratosTable = ({
    columns,
    data,
    setInfo,
    modaltoggle,
    type,
    myTable
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
        if (column.accessorKey === 'saldoAnteriorComprador' || column.accessorKey === 'saldoAposComprador' || column.accessorKey === 'valorSolicitado') {
            return {
                ...column,
                cell: (value) => value.getValue() ? `RT$ ${formatarNumeroParaRT(value.getValue())}` : "RT$ 0,00",
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

    const invisibleFields = ["Agência", "Vendedor", "Comprador", "dataTermino", "dataInicio"]

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

    const revalidate = useRevalidate()
    return (
        <div className="w-full">
            <table className="w-full border-separate border-spacing-y-1">
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id} width={headerGroup.getSize} className="text-left">
                            {headerGroup.headers.map(header => (
                                <th key={header.id} className={`${invisibleFields.includes(header.column.columnDef.header) ? "hidden" : ""} `}>
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
                                <td key={cell.id} className={`${invisibleFields.includes(cell.column.columnDef.header) ? "hidden" : ""} `}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                            <td className="flex justify-end gap-2">
                                {myTable && type !== "Matriz" && row.original.status === "Concluída" ?
                                    <Buttons
                                        type="Undo"
                                        url={row.original.idTransacao}
                                        confirm={"Deseja solicitar o extorno?"}
                                        titulo={"Extorno"}
                                        resultDelete={"Extorno solicitado com sucesso"}
                                        revalidate={() => revalidate("login")}
                                    />
                                    : null
                                }
                                {type === "Agência" ?
                                    <Buttons
                                        type="Send"
                                        url={row.original.idTransacao}
                                        confirm={"Deseja solicitar o extorno?"}
                                        titulo={"Extorno"}
                                        resultDelete={"Extorno solicitado com sucesso"}
                                        revalidate={() => revalidate("login")}
                                    />
                                    : null
                                }
                                {type === "Matriz" ?
                                    <Buttons
                                        type="Aprove"
                                        url={row.original.idTransacao}
                                        confirm={"Deseja aprovar o extorno?"}
                                        titulo={"Extorno"}
                                        resultDelete={"Extorno aprovado com sucesso"}
                                        revalidate={() => revalidate("login")}
                                    />
                                    : null
                                }
                                <Buttons
                                    type="Info"
                                    setId={() => { }}
                                    setInfo={setInfo}
                                    info={row.original}
                                    value={row.original.idPlano}
                                    modal={modaltoggle}
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

export default ExtratosTable;
