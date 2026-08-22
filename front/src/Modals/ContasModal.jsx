import Modal from 'react-modal';
import { useState } from 'react';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { formatDate } from '../hooks/ListasHook';
import { TIPO_LABEL, nomeEntidade, valorCobranca } from '../pages/contas/constantsContas';

const appElement = document.getElementById('root');
Modal.setAppElement(appElement);

const ContasModal = ({ isOpen, modalToggle, info }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const data = info
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
