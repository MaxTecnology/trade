import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import PaginationTable from "./PaginationTable";
import { formatColumns } from "./tableFunctions";
import SortColumn from "./SortColumn";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import filters from "@/store/filters";

const OfertasTable = ({
    columns,
    data,
    setId,
    setInfo,
    modaltoggle,
    admin }) => {
    const formattedColumns = formatColumns(columns);
    const snap = useSnapshot(filters.table);

    const [columnFilters, setColumnFilters] = useState([])

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

    const revalidate = useRevalidate()

    const invisibleFields = ["Agência", "Categoria", "Estado", "Cidade",]

    useEffect(() => {
        const filters = Object.entries(snap).map(([key, value]) => {
            if (key !== 'search') {
                return {
                    id: key,
                    value: value,
                };
            }
        }).filter(Boolean);
        console.log(filters)
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
                                <th key={header.id} className={`${invisibleFields.includes(header.column.columnDef.header) ? "hidden" : ""} `}>
                                    <div className="flex items-center gap-3">
                                        {header.column.columnDef.header}
                                        <SortColumn header={header} />
                                    </div>
                                </th>
                            ))}
                            <th className={`text-right ${admin ? "pr-6" : ""}`}>Operação</th>
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
                                {admin ? <Buttons
                                    type="Delete"
                                    confirm="Deseja excluir essa Oferta?"
                                    titulo="Oferta"
                                    resultDelete="Oferta excluida com sucesso!"
                                    url={`ofertas/deletar-oferta/${row.original.idOferta}`}
                                    revalidate={() => revalidate("ofertas")}
                                /> : null}
                                <Buttons
                                    type="Edit"
                                    setId={setId}
                                    setInfo={setInfo}
                                    info={row.original}
                                    value={row.original.idPlano}
                                    modal={modaltoggle}
                                />
                                <Buttons type="Eye" info={row.original} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <PaginationTable table={table} />
        </div>
    )
};

export default OfertasTable;
