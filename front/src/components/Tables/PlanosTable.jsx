import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import PaginationTable from "./PaginationTable";
import SortColumn from "./SortColumn";
import { formatColumns } from "./tableFunctions";

const PlanosTable = ({
    columns,
    data,
    setId,
    setInfo,
    modaltoggle }) => {

    const formattedColumns = formatColumns(columns);

    const table = useReactTable({
        data,
        columns: formattedColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    const revalidate = useRevalidate()

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
                                    type="Delete"
                                    confirm="Deseja excluir esse Plano?"
                                    titulo="Planos"
                                    resultDelete="Plano excluido com sucesso!"
                                    url={`planos/deletar-plano/${row.original.idPlano}`}
                                    revalidate={() => revalidate("planos")}
                                />
                                <Buttons
                                    type="Edit"
                                    setId={setId}
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

export default PlanosTable;
