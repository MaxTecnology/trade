import Modal from 'react-modal';
import { useState } from 'react';
import { useSnapshot } from 'valtio';
import { GrFormClose } from 'react-icons/gr';
import state from '@/store';
import { refound } from '@/hooks/ListasHook';

// Motivo é obrigatório — é o que a Matriz usa pra analisar e decidir
// aprovar/negar a solicitação (aprovação sempre é da Matriz, mesmo quando
// a Agência intermedia encaminhando).
const SolicitarEstornoModal = () => {
    useSnapshot(state)
    const [motivo, setMotivo] = useState('')
    const isOpen = !!state.estornoModalOpen

    const close = () => {
        state.estornoModalOpen = false
        state.estornoTransacaoId = null
        state.estornoRevalidate = null
        setMotivo('')
    }

    const submitHandler = (event) => {
        event.preventDefault()
        const transacaoId = state.estornoTransacaoId
        const revalidate = state.estornoRevalidate
        refound(transacaoId, motivo, revalidate)
        close()
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            className={"modalEditPanel modalAnimationEdit"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className='modalEditHeader'>
                <p>Solicitar Estorno</p>
                <GrFormClose className="closeButton" onClick={close} />
            </div>
            <div className='modalDivider'></div>
            <form className="containerForm" onSubmit={submitHandler}>
                <div className="form-group">
                    <label className="required">Motivo do estorno</label>
                    <textarea
                        required
                        minLength={10}
                        rows={4}
                        placeholder="Descreva o motivo — a Matriz vai analisar pra aprovar ou negar"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                    />
                </div>
                <div className="buttonContainer">
                    <button type="button" className="modalButtonClose" onClick={close}>Cancelar</button>
                    <button type="submit" className="modalButtonSave">Solicitar</button>
                </div>
            </form>
        </Modal>
    )
};

export default SolicitarEstornoModal;
