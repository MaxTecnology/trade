import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import Buttons from "../Buttons";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import PaginationTable from "./PaginationTable";
import { formatColumns } from "./tableFunctions";
import SortColumn from "./SortColumn";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";
import filters from "@/store/filters";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import { TbToggleLeft, TbToggleRight } from "react-icons/tb";
import api from "@/services/api";
import { toast } from "sonner";
import state from "@/store";
import { popup } from "@/hooks/Popup";

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

    const handleToggleStatus = (oferta) => {
        const novoStatus = oferta.status === 'aberta' ? 'fechada' : 'aberta'
        const acao = novoStatus === 'aberta' ? 'reabrir' : 'fechar'
        state.action = () => toast.promise(
            api.patch(`ofertas/${oferta.id}/status`, { status: novoStatus })
                .then(() => revalidate("ofertas")),
            {
                loading: `${novoStatus === 'aberta' ? 'Reabrindo' : 'Fechando'} oferta...`,
                success: `Oferta ${novoStatus === 'aberta' ? 'reaberta' : 'fechada'}!`,
                error: (e) => e?.response?.data?.error?.message || 'Erro ao alterar status da oferta',
            }
        )
        popup(`Deseja ${acao} esta oferta?`, "Oferta")
    }

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
                                {admin ? <ButtonMotion
                                    className={row.original.status === 'aberta' ? "buttonGreen" : "buttonDelete"}
                                    type="button"
                                    title={row.original.status === 'aberta' ? 'Fechar oferta' : 'Reabrir oferta'}
                                    onClick={() => handleToggleStatus(row.original)}
                                >
                                    {row.original.status === 'aberta' ? <TbToggleRight /> : <TbToggleLeft />}
                                </ButtonMotion> : null}
                                <Buttons
                                    type="Edit"
                                    setId={setId}
                                    setInfo={setInfo}
                                    info={row.original}
                                    value={row.original.id}
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
