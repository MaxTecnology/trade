import Modal from 'react-modal';
import { useQuery } from '@tanstack/react-query';
import { GrFormClose } from "react-icons/gr";
import { formatDate, getApiData } from '@/hooks/ListasHook';
import { formatarNumeroParaReal } from '@/utils/functions/formartNumber';

const appElement = document.getElementById('root');
Modal.setAppElement(appElement);

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const formatarCompetencia = (iso) => {
    const d = new Date(iso);
    return `${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};

// Mostra as comissões (por transação ou inscrição) que somaram o valor
// consolidado desse pagamento de gerente (decisão de produto 2026-09-19).
const PagamentoGerenteModal = ({ isOpen, onClose, pagamento }) => {
    const { data: detalheResp, isLoading } = useQuery({
        queryKey: ['comissoesDoPagamento', pagamento?.id],
        queryFn: async () => getApiData(`gerentes/pagamentos/${pagamento.id}/comissoes`),
        enabled: isOpen && !!pagamento?.id,
    });
    const detalhe = detalheResp?.data ?? [];

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
                            <table className="w-full border-separate border-spacing-y-1">
                                <thead>
                                    <tr className="text-left">
                                        <th>Data</th>
                                        <th>Associado</th>
                                        <th>Tipo</th>
                                        <th>Comissão</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalhe.map((c) => (
                                        <tr key={c.id}>
                                            <td>{formatDate(c.criadoEm)}</td>
                                            <td>{c.associado?.nome ?? '-'}</td>
                                            <td>{c.tipoComissao === 'inscricao' ? 'Inscrição' : 'Transação'}</td>
                                            <td>R$ {formatarNumeroParaReal(Number(c.comissaoBRL ?? 0))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
