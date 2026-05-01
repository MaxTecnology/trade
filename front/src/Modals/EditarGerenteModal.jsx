import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Mascaras from '@/hooks/Mascaras';
import { editUser } from '@/hooks/ListasHook';
import { closeModal } from '@/hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { BiSolidImageAdd } from 'react-icons/bi';
import { imageReferenceHandler } from '@/utils/functions/formHandler';
import { toast } from 'sonner';
import useRevalidate from '@/hooks/ReactQuery/useRevalidate';
import PlanosFields from '@/components/Form/PlanosFields';
import RealInput from '@/components/Inputs/CampoMoeda';
import InputMask from 'react-input-mask';

const EditarGerenteModal = ({ isOpen, modalToggle, associadoInfo }) => {
    const [imagemReference, setImageReference] = useState(null);
    const [reference, setReference] = useState(true)
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const info = associadoInfo
    useEffect(() => {
        Mascaras()
        setImageReference(info.imagem)
    }, [info.imagem]);

    const revalidate = useRevalidate();

    const formHandler = (event) => {
        event.preventDefault()
        toast.promise(editUser(event), {
            loading: 'Editando Gerente...',
            success: () => {
                modalToggle()
                revalidate("gerentes")
                return "Gerente editado com sucesso!"
            },
            error: (error) => {
                return <b>{error.message}</b>
            },
        })
    }
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Editar Associado"
            className="modalContainer modalAnimationUser"
            overlayClassName="modalOverlay modalAnimationUserOverlay"
        >
            <div className='modalEditHeader'>
                <p>Editar Gerente</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm">
                <div className="form-group f4">
                    <label className="required-field-label f4">Razão Social</label>
                    <input
                        defaultValue={info.razaoSocial} type="text" className="form-control" id="razaoSocial" name="razaoSocial" required />
                </div>
                <div className="form-group f4">
                    <label className="required-field-label f4">Nome Fantasia</label>
                    <input
                        defaultValue={info.nomeFantasia
                        } type="text" className="form-control" id="nomeFantasia" name="nomeFantasia" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">CNPJ</label>
                    <InputMask mask="99.999.999/9999-99" maskChar={null} defaultValue={info.cnpj}>
                        {(inputProps) => <input {...inputProps} type="text" id="cnpj" name="cnpj" required />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Insc. Estadual</label>
                    <input
                        defaultValue={info.inscEstadual} type="text" className="form-control" id="inscEstadual" name="inscEstadual" required />
                </div>
                <div className="form-group">
                    <label>Insc. Municipal</label>
                    <input
                        defaultValue={info.inscMunicipal} type="text" className="form-control" id="inscMunicipal" name="inscMunicipal" required />
                </div>

                <div className="formDivider">
                    <p>Contato</p>
                </div>
                {/* CONTATO */}
                <div className="form-group f2">
                    <label className="required-field-label">Nome</label>
                    <input
                        defaultValue={info.nomeContato} type="text" className="form-control" id="nomeContato" name="nomeContato" required />
                </div>
                <div className="form-group f2">
                    <label>Telefone</label>
                    <InputMask mask="(99)9999-9999" maskChar={null} defaultValue={info.telefone}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" id="telefone" name="telefone" required />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">Celular</label>
                    <InputMask mask="(99)99999-9999" maskChar={null} defaultValue={info.celular}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" id="celular" name="celular" required />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">E-mail</label>
                    <input
                        defaultValue={info.emailContato} type="email" className="form-control" id="emailContato" name="emailContato" />
                </div>
                <div className="form-group f2">
                    <label>E-mail secundário</label>
                    <input
                        defaultValue={info.emailSecundario} type="email" className="form-control" id="emailSecundario" name="emailSecundario" />
                </div>
                {/* ENDEREÇO */}
                <div className="formDivider">
                    <p>Endereço</p>
                </div>
                {/* ENDEREÇO */}
                <div className="form-group">
                    <label className="required-field-label">Logradouro</label>
                    <input
                        defaultValue={info.logradouro} type="text" className="form-control" id="logradouro" name="logradouro" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Número</label>
                    <input
                        defaultValue={info.numero} type="number" className="form-control" id="numero" name="numero" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">CEP</label>
                    <input
                        defaultValue={info.cep} type="text" className="form-control" id="cep" name="cep" required />
                </div>
                <div className="form-group">
                    <label>Complemento</label>
                    <input
                        defaultValue={info.complemento} type="text" className="form-control" id="complemento" name="complemento" />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Bairro</label>
                    <input
                        defaultValue={info.bairro} type="text" className="form-control" id="bairro" name="bairro" required />
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">Cidade</label>
                    <input
                        defaultValue={info.cidade} type="text" className="form-control" id="cidade" name="cidade" required />
                </div>
                <div className="form-group f1">
                    <label className="required-field-label">Estado</label>
                    <input
                        defaultValue={info.estado} type="text" className="form-control" id="estado" name="estado" required />
                </div>
                <div className="form-group">
                    <label>Região</label>
                    <input
                        defaultValue={info.regiao} type="text" className="form-control" id="regiao" name="regiao" />
                </div>
                {/* Operações */}
                <div className="formDivider">
                    <p>Unidade</p>
                </div>
                <PlanosFields type={"Gerente"} defaultValue={info} />
                <div className="form-group">
                    <label className="required">Nome da Agência </label>
                    <input type="text" className="readOnly" readOnly required value={info.conta.nomeFranquia} />
                </div>
                {/* Operações */}
                <div className="formDivider">
                    <p>Operações</p>
                </div>
                {/* Operações */}
                <div className="form-group">
                    <label className="required-field-label">Limite Crédito</label>
                    <RealInput defaultValue={info.conta?.limiteCredito} name="limiteCredito" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Limite de Venda Mensal</label>
                    <RealInput defaultValue={info.conta?.limiteVendaMensal} name="limiteVendaMensal" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Limite de Venda Total</label>
                    <RealInput defaultValue={info.conta?.limiteVendaTotal} name="limiteVendaTotal" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Taxa repasse Matriz em %</label>
                    <input type="number" defaultValue={info.conta.taxaRepasseMatriz} className="form-control" name="taxaRepasseMatriz" required />
                </div>
                <div className="form-group">
                    <label>Data Vencimento Fatura</label>
                    <select defaultValue={info.dataVencimentoFatura} className="form-control" id="dataVencimentoFatura" name="dataVencimentoFatura">
                        <option value="" disabled>Selecionar</option>
                        <option>10</option>
                        <option>20</option>
                        <option>30</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Tipo de Operação</label>
                    <select defaultValue={info.tipoOperacao} className="form-control" id="tipoOperacao" name="tipoOperacao">
                        <option value="" disabled>Selecionar</option>
                        <option value={1}>Compra</option>
                        <option value={2}>Venda</option>
                        <option value={3}>Compra/Venda</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Aceita Orçamento</label>
                    <select defaultValue={info.aceitaOrcamento} className="form-control" id="aceitaOrcamento" name="aceitaOrcamento">
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Sim</option>
                        <option value={false}>Não</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Aceita Voucher</label>
                    <select defaultValue={info.aceitaVoucher} className="form-control" id="aceitaVoucher" name="aceitaVoucher">
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Sim</option>
                        <option value={false}>Não</option>
                    </select>
                </div>
                {/* 
                {/* DADOS USUÁRIO */}
                <div className="formDivider">
                    <p>Dados do usuário</p>
                </div>
                {/* DADOS USUÁRIO */}
                <div className="formImage">
                    <img src={imagemReference} className="rounded float-left img-fluid" alt="..." id="imagem-selecionada" name="imagem-selecionada" />
                </div>
                <div className="form-group">
                    <label htmlFor="img_path" className="inputLabel">
                        <BiSolidImageAdd /> Selecione uma imagem
                        <input type="file" accept="image/*" className="custom-file-input" id="img_path" onChange={(e) => imageReferenceHandler(e, setImageReference)} />
                    </label>
                </div>
                <div className="form-group">
                    <label className="required-field-label">Nome</label>
                    <input defaultValue={info.nome} type="text" className="form-control" id="nome" name="nome" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Cpf</label>
                    <InputMask mask="999.999.999-99" maskChar={null} defaultValue={info.cpf}>
                        {(inputProps) => <input  {...inputProps} type="text" className="form-control" id="cpf" name="cpf" required />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label className="required-field-label ">E-mail</label>
                    <input defaultValue={info.email} type="email" className="form-control" id="email" name="email" required />
                </div>
                {/* INVISIBLE INPUTS */}
                <input type="hidden" name="gerente" value={info.conta.gerenteContaId} />
                <input type="hidden" name="contaId" value={info.conta.idConta} />
                <input type="hidden" name="idUsuario" value={info.idUsuario} />

                <div className="buttonContainer">
                    <button className='modalButtonClose' type='button' onClick={() => closeModal(modalToggle, setSucess, setError)} >Fechar</button>
                    <button className='modalButtonSave' type="submit">Salvar alterações</button>
                </div>
            </form>
        </Modal>
    );
};

export default EditarGerenteModal;
