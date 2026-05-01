import Modal from 'react-modal';
import { editItem } from '../hooks/ListasHook';
import { useState } from 'react';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { toast } from 'sonner';
import useRevalidate from '@/hooks/ReactQuery/useRevalidate';

// Defina o elemento principal da sua aplicação (geralmente '#root' para um aplicativo React)
const appElement = document.getElementById('root');

// Configure o elemento principal para o react-modal
Modal.setAppElement(appElement);
const EditarCategoriaModal = ({ isOpen, modalToggle, url, info }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const revalidate = useRevalidate();
    const data = info
    const formHandler = (event) => {
        toast.promise(editItem(event, url), {
            loading: 'Editando dados...',
            success: () => {
                modalToggle()
                revalidate('categorias')
                return "Categoria editada com sucesso!"
            },
            error: 'Erro ao editar!'
        })
    }
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Editar Categoria"
            className={"modalEditPanel modalAnimationEdit"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className='modalEditHeader'>
                <p>Editar Categoria</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm">
                <div className='modalFormContentContainer'>
                    <div className="form-group f1">
                        <label htmlFor="nome">Nome da Categoria</label>
                        <input type="text" defaultValue={data.nomeCategoria} name="nomeCategoria" />
                    </div>
                    <div className="form-group f1"></div>
                </div>
                <div className='modalDivierForm'></div>
                <div className="buttonContainer">
                    <button className='modalButtonClose' type='button' onClick={() => closeModal(modalToggle, setSucess, setError)} >Fechar</button>
                    <button className='modalButtonSave' type="submit">Salvar alterações</button>
                </div>
            </form>
        </Modal>
    );
};

export default EditarCategoriaModal;
