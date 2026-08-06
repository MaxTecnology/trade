import Modal from 'react-modal';
import { useState } from 'react';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";

// Defina o elemento principal da sua aplicação (geralmente '#root' para um aplicativo React)
const appElement = document.getElementById('root');

// Configure o elemento principal para o react-modal
Modal.setAppElement(appElement);
const TransaçõesModal = ({ isOpen, modalToggle, info }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    // `info` pode ser uma Transacao direta (telas de listagem) ou uma
    // SolicitacaoEstorno com a transação aninhada em `transacao` (telas de estorno).
    const transacao = info?.transacao ?? info
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
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Vendedor</span>
                            <p>{transacao?.vendedor?.nome ?? '-'}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Comprador</span>
                            <p>{transacao?.comprador?.nome ?? '-'}</p>
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
