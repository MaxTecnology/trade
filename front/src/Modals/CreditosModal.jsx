import Modal from 'react-modal';
import { aproveCreditos, atualizarCreditos, deleteCreditos, formatDate, forwardCreditos, negateCreditos } from '../hooks/ListasHook';
import { useState } from 'react';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { useEffect } from 'react';
import { formateValue } from '../hooks/Mascaras';
import { formatarNumeroParaRT } from '@/utils/functions/formartNumber';
import { isAgencia, isAssociado, isMatriz } from '../hooks/getId';
import state from '../store';

const appElement = document.getElementById('root');
Modal.setAppElement(appElement);

const STATUS_LABEL = {
    em_analise: 'Em análise',
    encaminhado: 'Encaminhado',
    aprovado: 'Aprovado',
    negado: 'Negado',
}

const CreditosModal = ({ isOpen, modalToggle, info, setState }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const [respostaMatriz, setRespostaMatriz] = useState('')
    const data = info

    const close = () => closeModal(modalToggle, setSucess, setError)
    const submitHandler = (event) => {
        atualizarCreditos(event, data.id, modalToggle, setState)
    }
    useEffect(() => {
        formateValue()
    }, []);

    const pendente = data.status === 'em_analise' || data.status === 'encaminhado'
    // associadoId/agenciaId identifica DE QUEM é o pedido — comparar com o id
    // do usuário logado (idUsuario) sempre daria falso, já que são entidades
    // diferentes.
    const souDono =
        (isAssociado() && data.associadoId === state.user?.entityId) ||
        (isAgencia() && data.agenciaId === state.user?.entityId)
    // Encaminhar só existe pra pedido de associado — pedido da própria
    // Agência já cai direto na fila da Matriz.
    const podeEncaminhar = isAgencia() && !souDono && data.status === 'em_analise'

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            contentLabel="Detalhes da Transação"
            className={"modalEditPanel modalAnimationEdit"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className='modalEditHeader'>
                <p>Detalhes do pedido de Crédito</p>
                <GrFormClose onClick={close} />
            </div>
            <div className='modalDivider'></div>
            <form className="containerForm" onSubmit={(event) => submitHandler(event)}>
                <div className="modalTransacoesContainer">
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Solicitante</span>
                            <p>{data.associado?.nome ?? data.agencia?.nome}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Agência</span>
                            <p>{data.associado?.agencia?.nome ?? data.agencia?.nome ?? 'Matriz'}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Aumento de Limite</span>
                            <p>RT$ {formatarNumeroParaRT(data.valorSolicitado)}</p>
                        </div>
                    </div>
                    <div className="modalTransacoesDivider"></div>
                    <div className="modalTransacoesSubContainer">
                        <div className="modalTransacoesItem">
                            <span>Data de Solicitação</span>
                            <p>{formatDate(data.criadoEm)}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Status</span>
                            <p>{STATUS_LABEL[data.status] ?? data.status}</p>
                        </div>
                        <div className="modalTransacoesItem">
                            <span>Descrição</span>
                            <p>{data.descricao ? data.descricao : 'Sem descrição'}</p>
                        </div>
                    </div>
                    {!pendente &&
                        <>
                            <div className="modalTransacoesDivider"></div>
                            <div className="modalTransacoesSubContainer">
                                <div className="modalTransacoesItem">
                                    <span>Resposta da Matriz</span>
                                    <p>{data.respostaMatriz ?? 'Sem resposta registrada'}</p>
                                </div>
                            </div>
                        </>
                    }
                    <div className="modalTransacoesDivider"></div>
                    {souDono && data.status === 'em_analise' ?
                        <div className='rowForm'>
                            <span>Editar Pedido de Crédito</span>
                            <div className="form-group">
                                <label htmlFor="valorSolicitado">Aumento de Limite:</label>
                                <input required type="text" name="valorSolicitado" id="valorSolicitado" defaultValue={data.valorSolicitado} />
                            </div>
                            <div className="transacoesDesc">
                                <div className="form-group desc">
                                    <label>Descrição</label>
                                    <textarea defaultValue={data.descricao} name="descricao" rows={3} />
                                </div>
                            </div>
                        </div>
                        : null}
                    {isMatriz() && pendente &&
                        <div className='rowForm'>
                            <span>Decisão da Matriz</span>
                            <div className="transacoesDesc">
                                <div className="form-group desc">
                                    <label>Motivo da decisão</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Descreva por que o crédito foi aprovado ou negado"
                                        value={respostaMatriz}
                                        onChange={(e) => setRespostaMatriz(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    }
                </div>
                <div className='modalDivierForm'></div>
                {pendente
                    ?
                    <div className="buttonContainer">
                        {isMatriz() ? (
                            <>
                                <button
                                    className='modalAprove'
                                    type='button'
                                    onClick={() => aproveCreditos(data.id, respostaMatriz, modalToggle, setState)}
                                >
                                    Aprovar
                                </button>
                                <button
                                    className='modalDelete'
                                    type='button'
                                    onClick={() => negateCreditos(data.id, respostaMatriz, modalToggle, setState)}
                                >
                                    Negar
                                </button>
                            </>
                        ) : null
                        }
                        {souDono
                            ?
                            <>
                                {data.status === 'em_analise' &&
                                    <button
                                        className='modalDelete'
                                        type='button'
                                        onClick={() => deleteCreditos(data.id, modalToggle, setState)}
                                    >
                                        Deletar
                                    </button>
                                }
                                {data.status === 'em_analise' &&
                                    <button className='modalButtonSave' type="submit">Editar pedido</button>
                                }
                            </>
                            : null
                        }
                        {podeEncaminhar ?
                            <button type='button' onClick={() => forwardCreditos(data.id, modalToggle, setState)}>Encaminhar</button>
                            : null
                        }
                        <button className='modalButtonClose' type='button' onClick={close}>Fechar</button>
                    </div>
                    : <div className="buttonContainer">
                        <button className='modalButtonClose' type='button' onClick={close}>Fechar</button>
                    </div>}
            </form>
        </Modal>
    );
};

export default CreditosModal;
