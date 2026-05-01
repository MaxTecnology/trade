import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import { formatDate } from "../../hooks/ListasHook";
import PaginationTable from "./PaginationTable";
import SortColumn from "./SortColumn";
import { useEffect, useState } from "react";
import filters from "@/store/filters";
import { useSnapshot } from "valtio";
import useResetTransaçõesQuery from "@/hooks/useResetTransaçõesQuery";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";

const VoucherTable = ({
    columns,
    data,
    setInfo,
    modaltoggle,
    type,
    agencia,
    matriz
}) => {

    const snap = useSnapshot(filters.table);

    const [columnFilters, setColumnFilters] = useState([])
    console.log(data)
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
        if (column.accessorKey === 'valorRt') {
            return {
                ...column,
                cell: (value) => value.getValue() ? `RT$ ${formatarNumeroParaRT(value.getValue())}` : "Indefinido",
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

    const invisibleFields = ["Agência", "Categoria", "Estado", "Cidade",]
    console.log(data)
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

    const resetQuery = useResetTransaçõesQuery()

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
                                {type ?
                                    <Buttons
                                        type="Undo"
                                        url={row.original.idTransacao}
                                        confirm={"Deseja solicitar o extorno?"}
                                        titulo={"Voucher"}
                                        resultDelete={"Extorno solicitado com sucesso"}
                                        revalidate={() => resetQuery()}
                                    />
                                    : null
                                }
                                {agencia ?
                                    <Buttons
                                        type="Send"
                                        url={row.original.idTransacao}
                                        confirm={"Deseja encaminhar o extorno?"}
                                        titulo={"Voucher"}
                                        resultDelete={"Extorno encaminhado com sucesso"}
                                        revalidate={() => resetQuery()}
                                    />
                                    : null
                                }
                                {matriz ?
                                    <Buttons
                                        type="Aprove"
                                        url={row.original.idTransacao}
                                        confirm={"Deseja aprovar o extorno?"}
                                        titulo={"Voucher"}
                                        resultDelete={"Extorno aprovado com sucesso"}
                                        revalidate={() => resetQuery()}
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

export default VoucherTable;
