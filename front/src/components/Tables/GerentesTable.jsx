import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import PaginationTable from "./PaginationTable";
import SortColumn from "./SortColumn";
import { formatColumns } from "./tableFunctions";
import { useSnapshot } from "valtio";
import filters from "@/store/filters";
import { useEffect, useState } from "react";
import { TbLockOff, TbLock } from "react-icons/tb";
import { toast } from "sonner";
import { popup } from "@/hooks/Popup";
import state from "@/store";
import api from "@/services/api";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const GerentesTable = ({
    columns,
    data,
    setId,
    setInfo,
    modaltoggle }) => {

    const formattedColumns = formatColumns(columns);
    const snap = useSnapshot(filters.table);
    const [columnFilters, setColumnFilters] = useState([])
    const revalidate = useRevalidate()

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
        const activeFilters = Object.entries(snap).map(([key, value]) => {
            if (key !== 'search') {
                return { id: key, value };
            }
        }).filter(Boolean);
        table.setGlobalFilter(snap?.search);
        setColumnFilters(activeFilters);
    }, [table, snap]);

    const handleToggleStatus = (gerente) => {
        const novoStatus = !gerente.ativo
        const acao = novoStatus ? 'desbloquear' : 'bloquear'
        state.action = () => toast.promise(
            api.patch(`gerentes/${gerente.id}/status`, { ativo: novoStatus })
                .then(() => revalidate('gerentes')),
            {
                loading: `${novoStatus ? 'Desbloqueando' : 'Bloqueando'} gerente...`,
                success: `Gerente ${novoStatus ? 'desbloqueado' : 'bloqueado'} com sucesso!`,
                error: (e) => `Erro: ${e.message}`,
            }
        )
        popup(`Deseja ${acao} este gerente?`, 'Gerentes')
    }

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
                                    value={row.original.id}
                                    modal={modaltoggle}
                                />
                                <ButtonMotion
                                    className={row.original.ativo ? "buttonBloq" : "buttonUnlock"}
                                    type="button"
                                    onClick={() => handleToggleStatus(row.original)}
                                    title={row.original.ativo ? 'Bloquear acesso' : 'Desbloquear acesso'}
                                >
                                    {row.original.ativo ? <TbLockOff /> : <TbLock />}
                                </ButtonMotion>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <PaginationTable table={table} />
        </div>
    )
};

export default GerentesTable;
