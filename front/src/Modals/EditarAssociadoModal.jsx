import { useState } from 'react';
import Modal from 'react-modal';
import { closeModal } from '@/hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { BiSolidImageAdd } from 'react-icons/bi';
import RealInput from '@/components/Inputs/CampoMoeda';
import { toast } from 'sonner';
import useRevalidate from '@/hooks/ReactQuery/useRevalidate';
import PlanosFields from '@/components/Form/PlanosFields';
import Categoria_SubCategoriaOptions from '@/components/Options/Categoria_SubCategoriaOptions';
import { imageReferenceHandler } from '@/utils/functions/formHandler';
import ButtonMotion from '@/components/FramerMotion/ButtonMotion';
import InputMask from 'react-input-mask';
import api from '@/services/api';

const parseBRNumber = (val) => {
    if (!val && val !== 0) return undefined
    const cleaned = String(val).replace(/[^0-9,]/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : num
}

const EditarAssociadoModal = ({ isOpen, modalToggle, associadoInfo }) => {
    const [imagemReference, setImageReference] = useState(null);
    const [reference, setReference] = useState(true)
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const info = associadoInfo
    const contato = info?.contatos?.[0] ?? {}

    const revalidate = useRevalidate();

    const formHandler = async (event) => {
        event.preventDefault()
        setReference(false);

        const formData = new FormData(event.target)
        const raw = {}
        formData.forEach((value, key) => { raw[key] = value })

        // Upload imagem se selecionada
        const imagemInput = event.target.querySelector('input[name="imagem"]')
        const imagemFile = imagemInput?.files?.[0]
        delete raw.imagem
        if (imagemFile) {
            try {
                const fd = new FormData()
                fd.append('file', imagemFile)
                const res = await api.post('upload', fd)
                raw.imagemUrl = res.data?.data?.url ?? res.data?.url
            } catch (err) {
                setReference(true)
                toast.error(`Erro ao enviar imagem: ${err?.response?.data?.message ?? err.message}`)
                return
            }
        }

        // Boolean conversions
        if (raw.mostrarNoSite !== undefined) raw.mostrarNoSite = raw.mostrarNoSite === 'true'
        if (raw.aceitaOrcamento !== undefined) raw.aceitaOrcamento = raw.aceitaOrcamento === 'true'
        // Remove nomeUsuario — used only for display, no user update endpoint here
        delete raw.nomeUsuario

        // Number conversions for money fields
        for (const key of ['limiteCredito', 'limiteVendaMensal', 'limiteVendaTotal']) {
            const parsed = parseBRNumber(raw[key])
            if (parsed !== undefined) raw[key] = parsed
            else delete raw[key]
        }
        if (raw.diaVencimentoFatura) raw.diaVencimentoFatura = Number(raw.diaVencimentoFatura) || undefined

        // Remove empty strings
        Object.keys(raw).forEach(key => { if (raw[key] === '' || raw[key] === undefined) delete raw[key] })

        toast.promise(
            api.put(`associados/${info.id}`, raw).catch(err => {
                throw new Error(err?.response?.data?.message ?? 'Erro ao editar')
            }),
            {
                loading: 'Editando Associado...',
                success: () => {
                    setReference(true)
                    modalToggle()
                    revalidate('associados')
                    return 'Associado editado com sucesso!'
                },
                error: (err) => {
                    setReference(true)
                    return <b>{err.message}</b>
                },
            }
        )
    }

    if (!info) return null

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Editar Associado"
            className="modalContainer modalAnimationUser"
            overlayClassName="modalOverlay modalAnimationUserOverlay"
        >
            <div className='modalEditHeader'>
                <p>Editar Associado</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form onSubmit={formHandler} className="containerForm">
                <div className="form-group">
                    <label className="required-field-label">Razão Social</label>
                    <input defaultValue={info.nome} type="text" className="form-control" name="nome" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Nome Fantasia</label>
                    <input defaultValue={info.nomeFantasia} type="text" className="form-control" name="nomeFantasia" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Descrição</label>
                    <input defaultValue={info.descricao} type="text" className="form-control" name="descricao" required />
                </div>
                <div className="form-group">
                    <label>Status</label>
                    <select defaultValue={info.status} className="form-control" name="status">
                        <option value="" disabled>Selecionar</option>
                        <option value="ativo">Atendendo</option>
                        <option value="inativo">Não Atendendo</option>
                        <option value="suspenso">Suspenso</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required-field-label">CNPJ</label>
                    <InputMask mask="99.999.999/9999-99" maskChar={null} defaultValue={info.cnpj}>
                        {(inputProps) => <input {...inputProps} type="text" name="cnpj" required />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Insc. Estadual</label>
                    <input defaultValue={info.inscEstadual} type="text" className="form-control" name="inscEstadual" />
                </div>
                <div className="form-group">
                    <label>Insc. Municipal</label>
                    <input defaultValue={info.inscMunicipal} type="text" className="form-control" name="inscMunicipal" />
                </div>
                <div className="form-group">
                    <label>Restrições</label>
                    <input defaultValue={info.restricao} type="text" className="form-control" name="restricao" />
                </div>
                <Categoria_SubCategoriaOptions defaultValue={info} />
                <div className="form-group">
                    <label>Mostrar no site</label>
                    <select defaultValue={info.mostrarNoSite ? 'true' : 'false'} className="form-control" name="mostrarNoSite">
                        <option value="" disabled>Selecionar</option>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                    </select>
                </div>
                <div className="formDivider">
                    <p>Contato</p>
                </div>
                <div className="form-group f2">
                    <label>Nome</label>
                    <input defaultValue={contato.nomeContato} type="text" className="form-control" name="nomeContato" />
                </div>
                <div className="form-group f2">
                    <label>Telefone</label>
                    <InputMask mask="(99)9999-9999" maskChar={null} defaultValue={info.telefone}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" name="telefone" />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">Celular</label>
                    <InputMask mask="(99)99999-9999" maskChar={null} defaultValue={contato.celular}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" name="celular" required />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">E-mail</label>
                    <input defaultValue={contato.emailContato} type="email" className="form-control" name="emailContato" required />
                </div>
                <div className="form-group f2">
                    <label>E-mail secundário</label>
                    <input defaultValue={contato.emailSecundario} type="email" className="form-control" name="emailSecundario" />
                </div>
                <div className="form-group f2">
                    <label>Site</label>
                    <input defaultValue={contato.site} type="text" className="form-control" name="site" />
                </div>
                <div className="formDivider">
                    <p>Endereço</p>
                </div>
                <div className="form-group">
                    <label className="required-field-label">Logradouro</label>
                    <input defaultValue={info.logradouro} type="text" className="form-control" name="logradouro" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Número</label>
                    <input defaultValue={info.numero} type="text" className="form-control" name="numero" required />
                </div>
                <div className="form-group">
                    <label>CEP</label>
                    <InputMask mask="99999-999" maskChar={null} defaultValue={info.cep}>
                        {(inputProps) => <input {...inputProps} type="text" name="cep" />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Complemento</label>
                    <input defaultValue={info.complemento} type="text" className="form-control" name="complemento" />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Bairro</label>
                    <input defaultValue={info.bairro} type="text" className="form-control" name="bairro" required />
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">Cidade</label>
                    <input defaultValue={info.cidade} type="text" className="form-control" name="cidade" required />
                </div>
                <div className="form-group f1">
                    <label className="required-field-label">Estado</label>
                    <input defaultValue={info.estado} type="text" className="form-control" name="estado" required />
                </div>
                <div className="form-group">
                    <label>Região</label>
                    <input defaultValue={info.regiao} type="text" className="form-control" name="regiao" />
                </div>
                <div className="formDivider">
                    <p>Agência</p>
                </div>
                <PlanosFields type={"Associado"} defaultValue={info} />
                <div className="form-group">
                    <label>Data Vencimento Fatura</label>
                    <select defaultValue={info.diaVencimentoFatura} className="form-control" name="diaVencimentoFatura">
                        <option value="" disabled>Selecionar</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                    </select>
                </div>
                <div className="formDivider">
                    <p>Operações</p>
                </div>
                <div className="form-group">
                    <label>Tipo de Operação</label>
                    <select defaultValue={info.tipoOperacao} className="form-control" name="tipoOperacao">
                        <option value="" disabled>Selecionar</option>
                        <option value="compra">Compra</option>
                        <option value="venda">Venda</option>
                        <option value="compra_venda">Compra/Venda</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Limite Crédito</label>
                    <RealInput defaultValue={info.limiteCredito} name="limiteCredito" placeholder="Insira o limite" reference={reference} />
                </div>
                <div className="form-group">
                    <label>Limite de Venda Mensal</label>
                    <RealInput defaultValue={info.limiteVendaMensal} name="limiteVendaMensal" placeholder="Insira o limite" reference={reference} />
                </div>
                <div className="form-group">
                    <label>Limite de Venda Total</label>
                    <RealInput defaultValue={info.limiteVendaTotal} name="limiteVendaTotal" placeholder="Insira o limite" reference={reference} />
                </div>
                <div className="form-group">
                    <label>Aceita Orçamento</label>
                    <select defaultValue={info.aceitaOrcamento ? 'true' : 'false'} className="form-control" name="aceitaOrcamento">
                        <option value="" disabled>Selecionar</option>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                    </select>
                </div>
                <div className="formDivider">
                    <p>Dados do usuário</p>
                </div>
                <div className="formImage">
                    <img src={imagemReference || info.imagemUrl || ''} className="rounded float-left img-fluid" alt="..." />
                </div>
                <div className="form-group">
                    <label htmlFor="img_path" className="inputLabel">
                        <BiSolidImageAdd /> Selecione uma imagem
                        <input type="file" name='imagem' accept="image/*" className="custom-file-input" id="img_path"
                            onChange={(e) => imageReferenceHandler(e, setImageReference)} />
                    </label>
                </div>
                <div className="form-group">
                    <label className="required-field-label">Nome</label>
                    <input defaultValue={info.nome} type="text" className="form-control" name="nomeUsuario" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">E-mail</label>
                    <input defaultValue={info.email} type="email" className="form-control" name="email" required />
                </div>

                <div className="buttonContainer">
                    <ButtonMotion className='modalButtonClose' type='button' onClick={() => closeModal(modalToggle, setSucess, setError)}>Fechar</ButtonMotion>
                    <ButtonMotion className='modalButtonSave' type="submit">Salvar alterações</ButtonMotion>
                </div>
            </form>
        </Modal>
    );
};

export default EditarAssociadoModal;
