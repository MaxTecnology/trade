import Modal from 'react-modal';
import { editItem } from '../hooks/ListasHook';
import { useState } from 'react';
import { closeModal } from '../hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { toast } from 'sonner';
import useRevalidate from '@/hooks/ReactQuery/useRevalidate';

const appElement = document.getElementById('root');
Modal.setAppElement(appElement);

// tipoPlano: 'associado' | 'agencia' | 'gerente'
const EditarPlanoModal = ({ isOpen, modalToggle, url, info, tipoPlano }) => {
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const data = info
    const revalidate = useRevalidate()

    const formHandler = (event) => {
        toast.promise(editItem(event, url), {
            loading: 'Editando dados...',
            success: () => {
                modalToggle()
                revalidate("planos")
                return "Plano editado com sucesso!"
            },
            error: 'Erro ao editar!'
        })
    }

    const labels = { associado: 'Associado', agencia: 'Agência', gerente: 'Gerente' }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Editar Plano"
            className={"modalEditPanel modalAnimationEdit"}
            overlayClassName={"modalOverlay modalAnimationOverlay"}
        >
            <div className='modalEditHeader'>
                <p>Editar Plano {labels[tipoPlano] ?? ''}</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form onSubmit={formHandler} className="containerForm">
                <div className="modalFormContentContainer">
                    <input type="hidden" name="tipoPlano" value={tipoPlano} />
                    <div className="form-group f2">
                        <label>Nome do Plano</label>
                        <input type="text" defaultValue={data.nome} name="nome" />
                    </div>
                    <div className="form-group f2">
                        <label>Taxa de Comissão %</label>
                        <input type="number" step="0.01" defaultValue={data.percentualComissao} name="percentualComissao" />
                    </div>
                    {tipoPlano === 'associado' && <>
                        <div className="form-group f2">
                            <label>Taxa de Inscrição (RT$)</label>
                            <input type="number" step="0.01" defaultValue={data.taxaInscricaoRT} name="taxaInscricaoRT" />
                        </div>
                        <div className="form-group f2">
                            <label>Taxa de Manutenção Anual (RT$)</label>
                            <input type="number" step="0.01" defaultValue={data.taxaManutencaoAnualRT} name="taxaManutencaoAnualRT" />
                        </div>
                    </>}
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
