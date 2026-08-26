import Modal from 'react-modal';
import { useState } from 'react';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { formatDate } from '@/hooks/ListasHook';
import { formatarNumeroParaRT } from '@/utils/functions/formartNumber';
import { iniciadoPorLabel } from '@/utils/functions/tables/iniciadoPor';
import { compradorLabel, vendedorLabel } from '@/utils/functions/tables/compradorVendedor';

// Defina o elemento principal da sua aplicação (geralmente '#root' para um aplicativo React)
const appElement = document.getElementById('root');

// Configure o elemento principal para o react-modal
Modal.setAppElement(appElement);
const TransaçõesModal = ({ isOpen, modalToggle, info }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    // `info` pode ser uma Transacao direta (telas de listagem), uma
    // SolicitacaoEstorno com a transação aninhada em `transacao` (telas de
    // estorno), ou uma MovimentacaoConta (Meu Extrato, tem `saldoApos` — só
    // aí que existem Código/Data/Operação/Saldo Após próprios do lançamento).
    const transacao = info?.transacao ?? info
    const isMovimentacao = info?.saldoApos !== undefined
    // Numa MovimentacaoConta sem transação vinculada (ex: crédito puro),
    // `transacao` acima cai pro fallback `info` — e info.tipo (débito/crédito
    // do lançamento) colide com o nome do campo transacao.tipo (permuta/
    // negociada/estorno). Só mostra "Tipo" quando é uma transação de verdade.
    const tipoTransacao = isMovimentacao ? info?.transacao?.tipo : transacao?.tipo
    const iniciadoPor = iniciadoPorLabel(transacao)
    const statusLabel = {
        concluida: 'Concluída',
        pendente: 'Pendente',
        estornada: 'Estornada',
        falha: 'Falha',
    }[transacao?.status] ?? transacao?.status

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Detalhes da Transação"
            className={"modalEditPanel modalAnimationEdit"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className='modalEditHeader'>
                <p>Detalhes da Transação</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form className="containerForm">
                <div className="modalTransacoesContainer">
                    {isMovimentacao && (
                        <>
                            <div className="modalTransacoesSubContainer">
                                <div className="modalTransacoesItem">
                                    <span>Código</span>
                                    <p>{info.id?.slice(0, 8)}</p>
                                </div>
                                <div className="modalTransacoesItem">
                                    <span>Data</span>
                                    <p>{formatDate(info.criadoEm)}</p>
                                </div>
                                <div className="modalTransacoesItem">
                                    <span>Operação</span>
                                    <p>{info.tipo === 'credito' ? 'Crédito' : 'Débito'}</p>
                                </div>
                                <div className="modalTransacoesItem">
                                    <span>Saldo Após</span>
                                    <p>{`RT$ ${formatarNumeroParaRT(info.saldoApos ?? 0)}`}</p>
                                </div>
                            </div>
                            <div className="modalTransacoesDivider"></div>
                        </>
                    )}
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Vendedor</span>
                            <p>{vendedorLabel(transacao)}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Comprador</span>
                            <p>{compradorLabel(transacao)}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Status</span>
                            <p>{statusLabel ?? '-'}</p>
                        </div>
                    </div>
                    <div className="modalTransacoesDivider"></div>
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Descrição</span>
                            <p>{transacao?.descricao || 'Nenhuma'}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Valor RT$</span>
                            <p>{transacao?.valorRT ?? '-'}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Parcelas</span>
                            <p>{transacao?.parcelas ?? '1'}</p>
                        </div>
                        {tipoTransacao && (
                            <div className="modalTransacoesItem">
                                <span>Tipo</span>
                                <p>{tipoTransacao}</p>
                            </div>
                        )}
                        {iniciadoPor !== '-' && (
                            <div className="modalTransacoesItem">
                                <span>Iniciado por</span>
                                <p>{iniciadoPor}</p>
                            </div>
                        )}
                        {info?.motivo && (
                            <div className="modalTransacoesItem">
                                <span>Motivo do estorno</span>
                                <p>{info.motivo}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className='modalDivierForm'></div>
                <div className="buttonContainer">
                    <button className='modalButtonClose' type='button' onClick={() => closeModal(modalToggle, setSucess, setError)} >Fechar</button>
                </div>
            </form>
        </Modal>
    );
};

export default TransaçõesModal;
