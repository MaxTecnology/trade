import Modal from 'react-modal';
import { useState } from 'react';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";

// Defina o elemento principal da sua aplicação (geralmente '#root' para um aplicativo React)
const appElement = document.getElementById('root');

// Configure o elemento principal para o react-modal
Modal.setAppElement(appElement);
const TransaçõesModal = ({ isOpen, modalToggle, info, voucher }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const data = info
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
                            <p>{voucher ? data.transacao?.comprador.nomeFantasia || data.vendedor.nomeFantasia : data.nomeVendedor}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Comprador</span>
                            <p>{voucher ? data.transacao?.vendedor.nomeFantasia || data.comprador.nomeFantasia : data.nomeComprador}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Status</span>
                            <p>{data.status ? "Ativa" : "Encerrada"}</p>
                        </div>

                    </div>
                    <div className="modalTransacoesDivider"></div>
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Descrição</span>
                            <p>{data.transacao?.descricao || data.descricao || null}</p>
                        </div>
                        {/* <div className="modalTransacoesItem">
                            <span>Vencimento</span>
                            <p>{data.nomeVendedor}</p>
                        </div> */}
                        <div className="modalTransacoesItem">
                            <span>Valor RT$</span>
                            <p>{data.transacao?.comprador.nomeFantasia || data.valorRt}</p>
                        </div>
                        {/* <div className="modalTransacoesItem">
                            <span>StatusParcelas</span>
                            <p>{data.nomeVendedor}</p>
                        </div> */}
                        <div className="modalTransacoesItem">
                            <span>Parcelas</span>
                            <p>{voucher ? "1" : data.numeroParcelas}</p>
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

export default TransaçõesModal;
