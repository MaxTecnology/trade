import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { useState } from "react";
import PaginationTable from "./PaginationTable";
import SortColumn from "./SortColumn";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import { FaMoneyBill } from "react-icons/fa";
import { TbEyeSearch } from "react-icons/tb";
import api from "@/services/api";
import { toast } from "sonner";
import state from "@/store";
import { popup } from "@/hooks/Popup";
import { formatarNumeroParaReal } from "@/utils/functions/formartNumber";
import PagamentoGerenteModal from "@/Modals/PagamentoGerenteModal";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const formatarCompetencia = (iso) => {
    const d = new Date(iso);
    return `${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};

const columns = [
    { id: "gerente", accessorFn: (row) => row.gerente?.nome ?? "-", header: "Gerente" },
    { id: "competencia", accessorFn: (row) => row.competencia, header: "Competência", cell: (info) => formatarCompetencia(info.getValue()) },
    { id: "valor", accessorFn: (row) => row.valorBRL, header: "Valor", cell: (info) => `R$ ${formatarNumeroParaReal(Number(info.getValue()))}` },
    { id: "status", accessorFn: (row) => row.pago, header: "Status", cell: (info) => (info.getValue() ? "Pago" : "Pendente") },
];

// Pagamento de gerente é sempre por fora do sistema (PIX/dinheiro) — dar
// baixa aqui é só uma flag, nunca movimenta saldo de conta (diferente de
// quitar Cobranca em RT). Endpoint próprio (gerentes/pagamentos/:id/quitar),
// por isso não reaproveita Buttons type="Quitar" (hardcoded pra cobrancas).
const PagamentoGerenteTable = ({ data, revalidate }) => {
    const [detalheAberto, setDetalheAberto] = useState(null)
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const handleQuitar = (pagamento) => {
        state.action = () => toast.promise(
            api.patch(`gerentes/pagamentos/${pagamento.id}/quitar`).then(() => revalidate?.()),
            {
                loading: "Dando baixa no pagamento...",
                success: "Pagamento marcado como pago!",
                error: (e) => e?.response?.data?.error?.message || "Erro ao dar baixa no pagamento",
            }
        );
        popup(`Confirma que já pagou ${pagamento.gerente?.nome} por fora do sistema?`, "Pagamento de Gerente");
    };

    return (
        <div className="w-full">
            <PagamentoGerenteModal
                isOpen={!!detalheAberto}
                onClose={() => setDetalheAberto(null)}
                pagamento={detalheAberto}
            />
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
                                <ButtonMotion
                                    type="button"
                                    title="Ver detalhes"
                                    onClick={() => setDetalheAberto(row.original)}
                                >
                                    <TbEyeSearch />
                                </ButtonMotion>
                                {!row.original.pago ? (
                                    <ButtonMotion
                                        className="buttonQuitar"
                                        type="button"
                                        title="Dar baixa"
                                        onClick={() => handleQuitar(row.original)}
                                    >
                                        <FaMoneyBill />
                                    </ButtonMotion>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <PaginationTable table={table} />
        </div>
    );
};

export default PagamentoGerenteTable;
