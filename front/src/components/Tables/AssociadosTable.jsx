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


const AssociadosTable = ({
    columns,
    data,
    setId,
    setInfo,
    modaltoggle }) => {

    const snap = useSnapshot(filters.table);
    const revalidate = useRevalidate();
    const [columnFilters, setColumnFilters] = useState([])

    const handleToggleStatus = (associado) => {
        const ativo = associado.status === 'ativo'
        const novoStatus = ativo ? 'suspenso' : 'ativo'
        const acao = ativo ? 'bloquear' : 'desbloquear'
        state.action = () => toast.promise(
            api.patch(`associados/${associado.id}/status`, { status: novoStatus })
                .then(() => revalidate('associados')),
            {
                loading: `${ativo ? 'Bloqueando' : 'Desbloqueando'} associado...`,
                success: `Associado ${ativo ? 'bloqueado' : 'desbloqueado'} com sucesso!`,
                error: (e) => `Erro: ${e.message}`,
            }
        )
        popup(`Deseja ${acao} este associado?`, 'Associados')
    }

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
                                <Buttons
                                    type="Eye"
                                    associado
                                    info={row.original}
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

export default AssociadosTable;
