import Modal from 'react-modal';
import { closeModal } from '@/hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { toast } from 'sonner';
import useRevalidate from '@/hooks/ReactQuery/useRevalidate';
import { useState } from 'react';
import { editItem } from '@/hooks/ListasHook';

const appElement = document.getElementById('root');
Modal.setAppElement(appElement);

const EditarGerenteModal = ({ isOpen, modalToggle, associadoInfo, id }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const info = associadoInfo ?? {}
    const revalidate = useRevalidate();

    const formHandler = (event) => {
        toast.promise(editItem(event, `gerentes/${id}`), {
            loading: 'Editando Gerente...',
            success: () => {
                modalToggle()
                revalidate("gerentes")
                return "Gerente editado com sucesso!"
            },
            error: (error) => <b>{error.message}</b>,
        })
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Editar Gerente"
            className="modalEditPanel modalAnimationEdit"
            overlayClassName="modalOverlay modalAnimationOverlay"
        >
            <div className='modalEditHeader'>
                <p>Editar Gerente</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form onSubmit={formHandler} className="containerForm">
                <div className="modalFormContentContainer">
                    <div className="form-group f2">
                        <label>Nome</label>
                        <input type="text" name="nome" defaultValue={info.nome} />
                    </div>
                    <div className="form-group f2">
                        <label>E-mail</label>
                        <input type="email" name="email" defaultValue={info.email} />
                    </div>
                    <div className="form-group f2">
                        <label>Telefone</label>
                        <input type="text" name="telefone" defaultValue={info.associado?.telefone} />
                    </div>
                </div>
                <div className='modalDivierForm'></div>
                <div className="buttonContainer">
                    <button className='modalButtonClose' type='button'
                        onClick={() => closeModal(modalToggle, setSucess, setError)}
                    >Fechar</button>
                    <button className='modalButtonSave' type="submit">Salvar alterações</button>
                </div>
            </form>
        </Modal>
    );
};

export default EditarGerenteModal;
