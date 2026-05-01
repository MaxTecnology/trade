import Modal from 'react-modal';
import { useState } from 'react';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { FaStar } from 'react-icons/fa';
import { toast } from 'sonner';

// Defina o elemento principal da sua aplicação (geralmente '#root' para um aplicativo React)
const appElement = document.getElementById('root');

// Configure o elemento principal para o react-modal
Modal.setAppElement(appElement);
const NovaTransaçãoModal = ({ isOpen, modalToggle, setRate, sendItem, setObs }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const [rateValue, setRateValue] = useState("")

    const formHandler = (event) => {
        event.preventDefault();
        if (rateValue) {
            sendItem(event, setRateValue);
            modalToggle()
        } else {
            toast.error("Por favor insira uma nota de atendimento")
        }
    }

    const rateHandler = (number) => {
        setRate(number)
        setRateValue(number)
    }
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Detalhes da Transação"
            className={"modalEditPanel modalAnimationEdit modalAvaliação"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className='modalEditHeader'>
                <p>Avaliação de Atendimento</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form className="containerForm" onSubmit={formHandler}>
                <div className="transacoesRate">
                    <p>Nota do Atendimento</p>
                    <div className="rateContainer">
                        <div onClick={() => rateHandler("1")}>
                            <div className={rateValue == 1 ? 'starContainer active' : 'starContainer'}>
                                <FaStar />
                            </div>
                            <p>Péssimo</p>
                        </div>
                        <div onClick={() => rateHandler("3")}>
                            <div className={rateValue == 3 ? 'starContainer active' : 'starContainer'}>
                                <FaStar />
                                <FaStar />
                                <FaStar />
                            </div>
                            <p>Ruim</p>
                        </div>
                        <div onClick={() => rateHandler("4")}>
                            <div className={rateValue == 4 ? 'starContainer active' : 'starContainer'}>
                                <FaStar />
                                <FaStar />
                                <FaStar />
                                <FaStar />
                            </div>
                            <p>Bom</p>
                        </div>
                        <div onClick={() => rateHandler("5")}>
                            <div className={rateValue == 5 ? 'starContainer active' : 'starContainer'}>
                                <FaStar />
                                <FaStar />
                                <FaStar />
                                <FaStar />
                                <FaStar />
                            </div>
                            <p>Ótimo</p>
                        </div>
                    </div>
                </div>
                <div className="transacoesDesc">
                    <div className="form-group desc">
                        <label>Observação</label>
                        <textarea name="obs" rows={5} onChange={(e) => setObs(e.target.value)} />
                    </div>
                </div>
                <div className="buttonContainer">
                    <button type='button' onClick={() => closeModal(modalToggle, setSucess, setError)}>Voltar</button>
                    <button className='confirmButton' type='submit'>Finalizar</button>
                </div>
            </form>
        </Modal>
    );
};

export default NovaTransaçãoModal;
