import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import PaginationTable from "./PaginationTable";
import { formatColumns } from "./tableFunctions";
import SortColumn from "./SortColumn";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import filters from "@/store/filters";
import { TbLockOff, TbLock } from "react-icons/tb";
import { toast } from "sonner";
import { popup } from "@/hooks/Popup";
import state from "@/store";
import api from "@/services/api";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const AgenciasTable = ({ columns, data, setId, setInfo, modaltoggle }) => {
    const snap = useSnapshot(filters.table);
    const revalidate = useRevalidate();
    const [columnFilters, setColumnFilters] = useState([])

    const handleToggleStatus = (agencia) => {
        const ativo = agencia.status === 'ativo'
        const novoStatus = ativo ? 'suspenso' : 'ativo'
        const acao = ativo ? 'bloquear' : 'desbloquear'
        state.action = () => toast.promise(
            api.patch(`agencias/${agencia.id}/status`, { status: novoStatus })
                .then(() => revalidate('agencias')),
            {
                loading: `${ativo ? 'Bloqueando' : 'Desbloqueando'} agência...`,
                success: `Agência ${ativo ? 'bloqueada' : 'desbloqueada'} com sucesso!`,
                error: (e) => `Erro: ${e.message}`,
            }
        )
        popup(`Deseja ${acao} esta agência?`, 'Agências')
    }

    const formattedColumns = formatColumns(columns);

    const table = useReactTable({
        data,
        columns: formattedColumns,
        state: { columnFilters },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    useEffect(() => {
        const fs = Object.entries(snap).map(([key, value]) => {
            if (key !== 'search') return { id: key, value }
        }).filter(Boolean);
        table.setGlobalFilter(snap?.search);
        setColumnFilters(fs);
    }, [table, snap]);

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
                            <th className="text-right">Operação</th>
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
                                    className={row.original.status === 'ativo' ? "buttonBloq" : "buttonDelete"}
                                    type="button"
                                    onClick={() => handleToggleStatus(row.original)}
                                    title={row.original.status === 'ativo' ? 'Bloquear acesso' : 'Desbloquear acesso'}
                                >
                                    {row.original.status === 'ativo' ? <TbLockOff /> : <TbLock />}
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

export default AgenciasTable;
