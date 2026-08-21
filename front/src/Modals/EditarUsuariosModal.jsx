import Modal from 'react-modal';
import { useState } from 'react';
import { closeModal } from '@/hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { toast } from 'sonner';
import { updateUser } from '@/hooks/ListasHook';
import useRevalidate from '@/hooks/ReactQuery/useRevalidate';

const ROLE_LABEL = {
    associate_admin: 'Administrador Associado',
    associate_operator: 'Operador Associado',
    agency_admin: 'Administrador de Agência',
    agency_operator: 'Operador de Agência',
}

// Sub-conta = Usuario (nome/email/role/ativo) — não tem CNPJ, endereço,
// limites etc. (isso é dado de Associado/Agência, entidade diferente).
const EditarUsuariosModal = ({ isOpen, modalToggle, associadoInfo }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const info = associadoInfo
    const revalidate = useRevalidate()

    const close = () => closeModal(modalToggle, setSucess, setError)

    const formHandler = (event) => {
        setLoading(true)
        toast.promise(updateUser(event, info.id), {
            loading: 'Atualizando usuário...',
            success: () => {
                setLoading(false)
                revalidate('usuarios')
                close()
                return "Usuário atualizado com sucesso!"
            },
            error: (err) => {
                setLoading(false)
                return err?.response?.data?.error?.message ?? "Erro ao atualizar usuário"
            },
        })
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            contentLabel="Editar Usuário"
            className="modalEditPanel modalAnimationEdit"
            overlayClassName="modalOverlay modalAnimationOverlay"
        >
            <div className='modalEditHeader'>
                <p>Editar Usuário</p>
                <GrFormClose onClick={close} />
            </div>
            <div className='modalDivider'></div>
            <form onSubmit={formHandler} className="containerForm">
                <div className="form-group">
                    <label className="required">Nome</label>
                    <input defaultValue={info.nome} type="text" name="nome" required />
                </div>
                <div className="form-group">
                    <label className="required">E-mail</label>
                    <input defaultValue={info.email} type="email" name="email" required />
                </div>
                <div className="form-group">
                    <label>Perfil</label>
                    <input defaultValue={ROLE_LABEL[info.role] ?? info.role} type="text" className="readOnly" readOnly />
                </div>
                <div className="form-group">
                    <label>Status</label>
                    <select defaultValue={String(info.ativo)} name="ativo">
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                    </select>
                </div>
                <div className="buttonContainer">
                    <button className='modalButtonClose' type='button' onClick={close}>Fechar</button>
                    <button className='modalButtonSave' type="submit" disabled={loading}>Salvar alterações</button>
                </div>
            </form>
        </Modal>
    );
};

export default EditarUsuariosModal;
