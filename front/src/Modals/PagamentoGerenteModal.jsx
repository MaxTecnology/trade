import Modal from 'react-modal';
import { useQuery } from '@tanstack/react-query';
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { GrFormClose } from "react-icons/gr";
import { formatDate, getApiData } from '@/hooks/ListasHook';
import { formatarNumeroParaReal } from '@/utils/functions/formartNumber';
import PaginationTable from '@/components/Tables/PaginationTable';

const appElement = document.getElementById('root');
Modal.setAppElement(appElement);

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const formatarCompetencia = (iso) => {
    const d = new Date(iso);
    return `${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};

const colunasDetalhe = [
    { id: "data", header: "Data", cell: (info) => formatDate(info.row.original.criadoEm) },
    { id: "associado", header: "Associado", cell: (info) => info.row.original.associado?.nome ?? '-' },
    { id: "tipo", header: "Tipo", cell: (info) => (info.row.original.tipoComissao === 'inscricao' ? 'Inscrição' : 'Transação') },
    {
        id: "comissao",
        header: "Comissão",
        cell: (info) => `R$ ${formatarNumeroParaReal(Number(info.row.original.comissaoBRL ?? 0))}`,
    },
];

// Mostra as comissões (por transação ou inscrição) que somaram o valor
// consolidado desse pagamento de gerente (decisão de produto 2026-09-19).
const PagamentoGerenteModal = ({ isOpen, onClose, pagamento }) => {
    const { data: detalheResp, isLoading } = useQuery({
        queryKey: ['comissoesDoPagamento', pagamento?.id],
        queryFn: async () => getApiData(`gerentes/pagamentos/${pagamento.id}/comissoes`),
        enabled: isOpen && !!pagamento?.id,
    });
    const detalhe = detalheResp?.data ?? [];
    // Antes renderizava `detalhe` inteira num .map() sem paginação — numa
    // fatura com muitas comissões, o modal (janela pequena) virava um scroll
    // interno enorme (achado do usuário, 2026-09-26).
    const tabelaDetalhe = useReactTable({
        data: detalhe,
        columns: colunasDetalhe,
        getRowId: (c) => c.id,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Detalhes do Pagamento de Gerente"
            className={"modalEditPanel modalAnimationEdit"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className='modalEditHeader'>
                <p>Detalhes do Pagamento — {pagamento?.gerente?.nome}</p>
                <GrFormClose onClick={onClose} />
            </div>
            <div className='modalDivider'></div>
            <div className="containerForm">
                <div className="modalTransacoesContainer">
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Competência</span>
                            <p>{pagamento?.competencia ? formatarCompetencia(pagamento.competencia) : '-'}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Valor total</span>
                            <p>R$ {formatarNumeroParaReal(Number(pagamento?.valorBRL ?? 0))}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Status</span>
                            <p>{pagamento?.pago ? "Pago" : "Pendente"}</p>
                        </div>
                    </div>
                    <div className="modalTransacoesDivider"></div>
                    <div className="modalTransacoesSubContainer" style={{ flexDirection: 'column', width: '100%' }}>
                        <span>Comissões que compõem esse valor</span>
                        {isLoading ? (
                            <p>Carregando...</p>
                        ) : detalhe.length === 0 ? (
                            <p>Nenhuma comissão encontrada.</p>
                        ) : (
                            <>
                                <table className="w-full border-separate border-spacing-y-1">
                                    <thead>
                                        <tr className="text-left">
                                            {tabelaDetalhe.getHeaderGroups()[0].headers.map((header) => (
                                                <th key={header.id}>{header.column.columnDef.header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tabelaDetalhe.getRowModel().rows.map((row) => (
                                            <tr key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <PaginationTable table={tabelaDetalhe} />
                            </>
                        )}
                    </div>
                </div>
                <div className='modalDivierForm'></div>
                <div className="buttonContainer">
                    <button className='modalButtonClose' type='button' onClick={onClose}>Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default PagamentoGerenteModal;
