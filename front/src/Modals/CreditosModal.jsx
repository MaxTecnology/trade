import Modal from 'react-modal';
import { aproveCreditos, atualizarCreditos, deleteCreditos, formatDate, forwardCreditos, negateCreditos } from '../hooks/ListasHook';
import { useState } from 'react';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { useEffect } from 'react';
import { formateValue } from '../hooks/Mascaras';
import { getId, getType } from '../hooks/getId';

// Defina o elemento principal da sua aplicação (geralmente '#root' para um aplicativo React)
const appElement = document.getElementById('root');

// Configure o elemento principal para o react-modal
Modal.setAppElement(appElement);
const CreditosModal = ({ isOpen, modalToggle, info, setState }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const data = info
    const submitHandler = (event) => {
        atualizarCreditos(event)
    }
    const type = getType()

    useEffect(() => {
        formateValue()
    }, []);
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Detalhes da Transação"
            className={"modalEditPanel modalAnimationEdit"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className='modalEditHeader'>
                <p>Detalhes do pedido de Crédito</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form className="containerForm" onSubmit={(event) => submitHandler(event)}>
                <div className="modalTransacoesContainer">
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span onClick={console.log(type)}>Nome</span>
                            <p>{data.usuarioSolicitante.nome}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Agência</span>
                            <p>{data.usuarioCriador.nome}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Valor</span>
                            <p>{data.valorSolicitado}</p>
                        </div>
                    </div>
                    <div className="modalTransacoesDivider"></div>
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Data de Solicitação</span>
                            <p>{formatDate(data.createdAt)}</p>

                        </div>
                        <div className="modalTransacoesItem">
                            <span>Status</span>
                            <p>{data.status}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Descrição</span>
                            <p>{data.descricaoSolicitante ? data.descricaoSolicitante : 'Sem descrição'}</p>
                        </div>
                    </div>
                    <div className="modalTransacoesDivider"></div>
                    {data.idSolicitacaoCredito === getId() && data.status !== 'Aprovado' && data.status !== "Negado" ?
                        <div className='rowForm'>
                            <span>Editar Pedido de Crédito</span>
                            <div className="form-group">
                                <label htmlFor="data">Valor:</label>
                                <input required type="text" name="valorSolicitado" id="valor" defaultValue={data.valorSolicitado} />
                            </div>
                            <div className="transacoesDesc">
                                <div className="form-group desc">
                                    <label>Descrição</label>
                                    <textarea required defaultValue={data.descricao} name="descricaoSolicitante
" rows={3} />
                                </div>
                            </div>
                        </div>
                        : null}
                </div>
                <div className='modalDivierForm'></div>
                {data.status !== 'Aprovado' && data.status !== "Negado"
                    ?
                    <div className="buttonContainer">
                        {type === 'Matriz' ? (
                            <>
                                <button
                                    className='modalAprove'
                                    type='button'
                                    onClick={
                                        () => {
                                            aproveCreditos(data.idSolicitacaoCredito, modalToggle, setState)
                                        }
                                    }
                                >
                                    Aprovar
                                </button>
                            </>
                        ) : null
                        }
                        {data.idSolicitacaoCredito === getId()
                            ?
                            <>
                                <button
                                    className='modalDelete'
                                    type='button'
                                    onClick={() => deleteCreditos(data.idSolicitacaoCredito, modalToggle, setState)}
                                >
                                    Deletar
                                </button>
                                <button className='modalButtonSave' type="submit">Editar pedido</button>
                            </>
                            :
                            <button
                                className='modalDelete'
                                type='button'
                                onClick={
                                    () =>
                                        negateCreditos(data.idSolicitacaoCredito, modalToggle, setState)
                                }
                            >
                                Recusar
                            </button>
                        }
                        {
                            type !== 'Matriz' && data.idSolicitacaoCredito !== getId() ?
                                <button type='button' onClick={() => forwardCreditos(data.idSolicitacaoCredito, modalToggle, setState)}>Encaminhar</button> : null
                        }
                        <button className='modalButtonClose' type='button' onClick={() => closeModal(modalToggle, setSucess, setError)} >Fechar</button>
                    </div>
                    : <div className="buttonContainer">
                        <button className='modalButtonClose' type='button' onClick={() => closeModal(modalToggle, setSucess, setError)} >Fechar</button>
                    </div>}
            </form>
        </Modal>
    );
};

export default CreditosModal;



