import Modal from 'react-modal';
import { useState } from 'react';
import { useSnapshot } from 'valtio';
import { GrFormClose } from 'react-icons/gr';
import state from '@/store';
import { aproveRefound, negarRefound } from '@/hooks/ListasHook';

// Motivo da decisão é obrigatório — pra quem pediu o estorno entender por
// que foi aprovado ou negado.
const DecisaoEstornoModal = () => {
    useSnapshot(state)
    const [resposta, setResposta] = useState('')
    const isOpen = !!state.decisaoEstornoModalOpen
    const isAprovar = state.decisaoEstornoTipo === 'aprovar'

    const close = () => {
        state.decisaoEstornoModalOpen = false
        state.decisaoEstornoId = null
        state.decisaoEstornoTipo = null
        state.decisaoEstornoRevalidate = null
        setResposta('')
    }

    const submitHandler = (event) => {
        event.preventDefault()
        const id = state.decisaoEstornoId
        const revalidate = state.decisaoEstornoRevalidate
        if (isAprovar) aproveRefound(id, resposta, revalidate)
        else negarRefound(id, resposta, revalidate)
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
                <p>{isAprovar ? 'Aprovar Estorno' : 'Negar Estorno'}</p>
                <GrFormClose className="closeButton" onClick={close} />
            </div>
            <div className='modalDivider'></div>
            <form className="containerForm" onSubmit={submitHandler}>
                <div className="form-group desc">
                    <label className="required">Motivo da decisão</label>
                    <textarea
                        required
                        minLength={10}
                        rows={4}
                        placeholder={isAprovar ? "Descreva por que o estorno foi aprovado" : "Descreva por que o estorno foi negado"}
                        value={resposta}
                        onChange={(e) => setResposta(e.target.value)}
                    />
                </div>
                <div className="buttonContainer">
                    <button type="button" className="modalButtonClose" onClick={close}>Cancelar</button>
                    <button type="submit" className={isAprovar ? "modalButtonSave" : "modalDelete"}>
                        {isAprovar ? 'Aprovar' : 'Negar'}
                    </button>
                </div>
            </form>
        </Modal>
    )
};

export default DecisaoEstornoModal;
