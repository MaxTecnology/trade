import Modal from 'react-modal';
import { editItem } from '../hooks/ListasHook';
import { useState } from 'react';
import { GrFormClose } from "react-icons/gr";
import { closeModal } from '../hooks/Functions';
import { toast } from 'sonner';

// Defina o elemento principal da sua aplicação (geralmente '#root' para um aplicativo React)
const appElement = document.getElementById('root');

// Configure o elemento principal para o react-modal
Modal.setAppElement(appElement);
const EditarSubCategoriaModal = ({ isOpen, modalToggle, info, revalidate }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const data = info

    const formHandler = (event) => {
        toast.promise(editItem(event, `categorias/editar-subcategoria/${data.idSubcategoria}`), {
            loading: 'Editando dados...',
            success: () => {
                modalToggle()
                revalidate('categorias')
                return "Sub categoria editada com sucesso!"
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
                <p>Editar Sub Categoria</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm">
                <div className="modalFormContentContainer">
                    <div className="form-group f1">
                        <label htmlFor="nome">Nome da SubCategoria</label>
                        <input type="text" defaultValue={data.nomeSubcategoria} name="nomeSubcategoria" />
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

export default EditarSubCategoriaModal;
