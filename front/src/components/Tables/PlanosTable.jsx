import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import PaginationTable from "./PaginationTable";
import SortColumn from "./SortColumn";
import { formatColumns } from "./tableFunctions";
import api from "@/services/api";
import { toast } from "sonner";
import state from "@/store";
import { popup } from "@/hooks/Popup";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import { TbToggleLeft } from "react-icons/tb";

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
                                <ButtonMotion
                                    className="buttonDelete"
                                    type="button"
                                    onClick={() => {
                                        state.action = () => toast.promise(
                                            api.patch(`planos/${row.original.id}/status`, { ativo: false })
                                                .then(() => revalidate("planos")),
                                            {
                                                loading: 'Desativando plano...',
                                                success: 'Plano desativado!',
                                                error: 'Erro ao desativar plano'
                                            }
                                        )
                                        popup("Deseja desativar este plano?", "Planos")
                                    }}
                                >
                                    <TbToggleLeft />
                                </ButtonMotion>
                                <Buttons
                                    type="Edit"
                                    setId={setId}
                                    setInfo={setInfo}
                                    info={row.original}
                                    value={row.original.id}
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
