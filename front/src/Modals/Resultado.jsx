
import Modal from 'react-modal';
import state from "../store";
import { useSnapshot } from "valtio";
import { GrFormClose } from "react-icons/gr";

const Resultado = () => {
    useSnapshot(state)
    const closeModal = () => {
        state.message = ""
        state.action = ""
        state.titulo = "Operação Concluida!"
    }
    const action = state.action
    return (
        <Modal
            isOpen={state.message}
            onRequestClose={() => closeModal()}
            className={"modalEditPanel modalAnimationEdit modalResultado"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className="resultadoTop">
                <h2 className="resultadoTitulo">{state.titulo}</h2>
                <GrFormClose className="closeButton" onClick={() => closeModal()} />
                <p className="resultadoMensagem">{state.message}</p>
                {state.action
                    ?
                    <div className="buttonContainer">
                        <button className="modalButtonClose" onClick={() => closeModal()}>Voltar</button>
                        <button className="modalButtonSave" onClick={() => { closeModal(); action() }}>Confirmar</button>
                    </div>
                    : null
                }
            </div>

        </Modal>
    )
};

export default Resultado;
