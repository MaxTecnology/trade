import Modal from 'react-modal';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { formatDate, getApiData } from '../hooks/ListasHook';
import { TIPO_LABEL, nomeEntidade, valorCobranca } from '../pages/contas/constantsContas';
import { formatarNumeroParaReal } from '@/utils/functions/formartNumber';

const appElement = document.getElementById('root');
Modal.setAppElement(appElement);

// tipo "comissao" é sempre consolidado mensalmente (várias transações somadas
// numa única cobrança) — mostra o detalhe de quais transações compõem esse
// valor, buscado só quando o modal abre pra esse tipo específico (decisão de
// produto 2026-09-19).
const ContasModal = ({ isOpen, modalToggle, info }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const data = info
    const mostrarDetalhe = isOpen && data?.tipo === 'comissao'
    const { data: detalheResp, isLoading: carregandoDetalhe } = useQuery({
        queryKey: ['comissoesDaFatura', data?.id],
        queryFn: async () => getApiData(`cobrancas/${data.id}/comissoes`),
        enabled: mostrarDetalhe,
    })
    const detalhe = detalheResp?.data ?? []
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Detalhes da Cobrança"
            className={"modalEditPanel modalAnimationEdit"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className='modalEditHeader'>
                <p>Detalhes da Cobrança</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form className="containerForm">
                <div className="modalTransacoesContainer">
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Nome</span>
                            <p>{nomeEntidade(data)}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Nº Conta</span>
                            <p>{data.conta?.numero ?? '-'}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Status</span>
                            <p>{data.pago ? "Paga" : "Pendente"}</p>
                        </div>
                    </div>
                    <div className="modalTransacoesDivider"></div>
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Descrição</span>
                            <p>{data.descricao || '-'}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Tipo</span>
                            <p>{TIPO_LABEL[data.tipo] ?? data.tipo}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Valor</span>
                            <p>{valorCobranca(data)}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Vencimento</span>
                            <p>{data.vencimento ? formatDate(data.vencimento) : '-'}</p>
                        </div>
                    </div>
                    {mostrarDetalhe && (
                        <>
                            <div className="modalTransacoesDivider"></div>
                            <div className="modalTransacoesSubContainer" style={{ flexDirection: 'column', width: '100%' }}>
                                <span>Transações que compõem esse valor</span>
                                {carregandoDetalhe ? (
                                    <p>Carregando...</p>
                                ) : detalhe.length === 0 ? (
                                    <p>Nenhuma transação encontrada.</p>
                                ) : (
                                    <table className="w-full border-separate border-spacing-y-1">
                                        <thead>
                                            <tr className="text-left">
                                                <th>Data</th>
                                                <th>Operação</th>
                                                <th>Valor da transação</th>
                                                <th>Comissão</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detalhe.map((c) => (
                                                <tr key={c.id}>
                                                    <td>{formatDate(c.transacao?.criadoEm)}</td>
                                                    <td>{c.operacao === 'compra' ? 'Compra' : 'Venda'}</td>
                                                    <td>RT$ {formatarNumeroParaReal(Number(c.transacao?.valorRT ?? 0))}</td>
                                                    <td>R$ {formatarNumeroParaReal(Number(c.comissaoBRL ?? 0))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
                <div className='modalDivierForm'></div>
                <div className="buttonContainer">
                    <button className='modalButtonClose' type='button' onClick={() => closeModal(modalToggle, setSucess, setError)} >Fechar</button>
                </div>
            </form>
        </Modal>
    );
};

export default ContasModal;
