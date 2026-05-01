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
const EditarPlanoModal = ({ isOpen, modalToggle, url, info, body, complex }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const data = info
    const nomePlano = body
    const revalidate = useRevalidate()

    const formHandler = (event) => {
        toast.promise(editItem(event, url), {
            loading: 'Editando dados...',
            success: () => {
                modalToggle()
                revalidate("planos")
                return "Plano Editado com sucesso!"
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
                <p>Editar Plano {nomePlano.tipo}</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm">

                <div className="modalFormContentContainer">
                    <div className="form-group f2">
                        <label htmlFor="nomeCategoria">Nome do Plano</label>
                        <input type="text" defaultValue={data.nomePlano} name="nomePlano" />
                    </div>
                    <div className="form-group f2">
                        <label htmlFor="nome">Taxa de Comissão %</label>
                        <input type="number" defaultValue={data.taxaComissao} name="taxaComissao" />
                    </div>
                    {complex ? <>
                        <div className="form-group f2">
                            <label htmlFor="nome">Taxa de Inscrição</label>
                            <input type="number" defaultValue={data.taxaInscricao} name="taxaInscricao" />
                        </div>
                        <div className="form-group f2">
                            <label htmlFor="nome">Taxa de Manutenção Anual </label>
                            <input type="number" defaultValue={data.taxaManutencaoAnual} name="taxaManutencaoAnual" />
                        </div>
                    </> : null}
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

export default EditarPlanoModal;
