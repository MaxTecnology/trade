import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import defaultImage from "@/assets/images/default_img.png"
import { updateUser } from '@/hooks/ListasHook';
import { closeModal } from '@/hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { BiSolidImageAdd } from 'react-icons/bi';
import RealInput from '@/components/Inputs/CampoMoeda';
import CategoriesOptions from '@/components/Options/CategoriesOptions';
import SubCategoriesOptions from '@/components/Options/SubCategoriesOptions';
import { toast } from 'sonner';
import { imageReferenceHandler } from '@/utils/functions/formHandler';
import useRevalidate from '@/hooks/ReactQuery/useRevalidate';

const EditarUsuariosModal = ({ isOpen, modalToggle, associadoInfo }) => {
    const [imagemReference, setImageReference] = useState(null);
    const [loading, setLoading] = useState(false)
    const [reference, setReference] = useState(true)
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const info = associadoInfo
    const url = `usuarios/atualizar-usuario/${info.idUsuario}`
    console.log(url)
    const isURL = (str) => {
        try {
            new URL(str);
            return true;
        } catch (_) {
            return false;
        }
    };
    const revalidate = useRevalidate()
    const imageUrl = isURL(info.imagem) ? info.imagem : defaultImage;
    useEffect(() => {
        setImageReference(imageUrl)
    }, [imageUrl]);

    const formHandler = (event) => {
        event.preventDefault()
        setTimeout(() => {
            toast.promise(updateUser(event, url), {
                loading: 'Atualizando dados...',
                success: () => {
                    setLoading(false)
                    revalidate("usuarios")
                    return "Dados atualizados com sucesso!"
                },
                error: (error) => {
                    setLoading(false)
                    return `Erro: ${error.message}`
                },
            })
            setReference(true)
        }, 100);  // Aguarde 100 milissegundos (ou o tempo específico)
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
                <p>Editar Associado</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm">
                <div className="form-group">
                    <label className="required-field-label">Razão Social</label>
                    <input
                        defaultValue={info.razaoSocial
                        } type="text" className="form-control" id="razaoSocial" name="razaoSocial" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Nome Fantasia</label>
                    <input
                        defaultValue={info.nomeFantasia
                        } type="text" className="form-control" id="nomeFantasia" name="nomeFantasia" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Descrição</label>
                    <input
                        defaultValue={info.descricao} type="text" className="form-control" id="descricao" name="descricao" required />
                </div>
                <div className="form-group">
                    <label>Status</label>
                    <select defaultValue={info.status} className="form-control" id="status" name="status">
                        <option value="" disabled>Selecionar</option>
                        <option value="true">Atendendo</option>
                        <option value="false">Não Atendendo</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required-field-label">CNPJ</label>
                    <input
                        defaultValue={info.cnpj} type="text" className="form-control" id="cnpj" name="cnpj" required />
                </div>
                <div className="form-group">
                    <label>Insc. Estadual</label>
                    <input
                        defaultValue={info.inscEstadual} type="text" className="form-control" id="inscEstadual" name="inscEstadual" />
                </div>
                <div className="form-group">
                    <label>Insc. Municipal</label>
                    <input
                        defaultValue={info.inscMunicipal} type="text" className="form-control" id="inscMunicipal" name="inscMunicipal" />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Restrições</label>
                    <input
                        defaultValue={info.restricao} type="text" className="form-control" id="restricoes" name="restricao" required />
                </div>
                <div className="form-group">
                    <label>Categoria</label>
                    <select defaultValue={info.categoria} className="form-control" id="categoria" name="categoria" required>
                        <option value="" disabled>Selecionar</option>
                        <CategoriesOptions />
                    </select>
                </div>
                <div className="form-group">
                    <label>Subcategoria</label>
                    <select defaultValue={info.subCategoria} className="form-control" id="subCategoriaSelect" name="subCategoria">
                        <option value="" disabled>Selecionar</option>
                        <SubCategoriesOptions />
                    </select>
                </div>
                <div className="form-group">
                    <label>Mostrar no site</label>
                    <select defaultValue={info.mostrarNoSite} className="form-control" id="mostrarNoSite" name="mostrarNoSite">
                        <option value="" disabled>Selecionar</option>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Tipo</label>
                    <select defaultValue={info.tipo} className="form-control" id="tipo">
                        <option value="" disabled>Selecionar</option>
                        <option value="Associado">Associado</option>
                    </select>
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
                    <input
                        defaultValue={info.telefone} type="text" className="form-control" id="telefone" name="telefone" />
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">Celular</label>
                    <input
                        defaultValue={info.celular} type="text" className="form-control" id="celular" name="celular" required />
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">E-mail</label>
                    <input
                        defaultValue={info.emailContato} type="email" className="form-control" id="emailContato" name="emailContato" required />
                </div>
                <div className="form-group f2">
                    <label>E-mail secundário</label>
                    <input
                        defaultValue={info.emailSecundario} type="email" className="form-control" id="emailSecundario" name="emailSecundario" />
                </div>
                <div className="form-group f2">
                    <label>Site</label>
                    <input defaultValue={info.site} type="text" className="form-control" id="site" name="site" />
                </div>
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
                {/* AGENCIA */}
                {/* <div className="formDivider">
                    <p>Agência</p>
                </div>
                <div className="form-group">
                    <label className="required-field-label">Plano de Inscrição</label>
                    <select defaultValue={info.planoDeInscricao} id="planoAssociado" >
                        <option value="" disabled>
                            Selecione
                        </option>
                        <PlanosOptions type="Associado" />
                    </select>

                </div>
                <div className="form-group">
                    <label className="required-field-label">Porcentagem Plano de Inscrição %</label>
                    <input
                        defaultValue={info.porcentagemPlanoDeInscricao} type="text" className="readOnly" id="porcentagemPlano" name="porcentagemPlanoDeInscricao" readOnly required />
                </div>
                <div className="form-group">
                    <label>Data Vencimento Fatura</label>
                    <select defaultValue={info.dataVencimentoFatura} className="form-control" id="dataVencimentoFatura" name="dataVencimentoFatura">
                        <option value="" disabled>Selecionar</option>
                        <option>10</option>
                        <option>20</option>
                        <option>30</option>
                    </select>
                </div> */}
                <div className="formDivider">
                    <p>Operações</p>
                </div>
                {/* Operações */}
                <div className="form-group">
                    <label>Gerente de Conta</label>
                    <select defaultValue={info.nomeFranquia ? info.nomeFranquia : info.idUsuario} className="form-control" id="gerentesSelect" name="gerente">
                        <option value="" disabled>Selecionar</option>
                        <option value={info.gerenteContaId ? info.gerenteContaId : info.idUsuario}>Sem Gerente</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required-field-label">Taxa Gerente Conta em %</label>
                    <input
                        defaultValue={info.taxaGerenteConta} type="number" className="form-control readOnly" id="taxaGerenteConta" readOnly />
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
                    <label className="required-field-label">Limite Crédito</label>
                    <RealInput defaultValue={info.limiteCredito} name="limiteCredito" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Limite de Venda Mensal</label>
                    <RealInput defaultValue={info.limiteVendaMensal} name="limiteVendaMensal" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Limite de Venda Total</label>
                    <RealInput defaultValue={info.limiteVendaTotal} name="limiteVendaTotal" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label>Aceita Orçamento</label>
                    <select defaultValue={info.aceitaOrcamento} className="form-control" id="aceitaOrcamento" name="aceitaOrcamento">
                        <option value="" disabled>Selecionar</option>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Aceita Voucher</label>
                    <select defaultValue={info.aceitaVoucher} className="form-control" id="aceitaVoucher" name="aceitaVoucher">
                        <option value="" disabled>Selecionar</option>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                    </select>
                </div>
                <div className="formDivider">
                    <p>Dados do usuário</p>
                </div>
                <div className="formImage">
                    <img src={imagemReference} className="rounded float-left img-fluid" alt="..." id="imagem-selecionada" name="imagem-selecionada" />
                </div>
                <div className="form-group">
                    <label htmlFor="img_path" className="inputLabel">
                        <BiSolidImageAdd /> Selecione uma imagem
                        <input type="file" name='imagem' accept="image/*" className="custom-file-input" id="img_path" onChange={(e) => imageReferenceHandler(e, setImageReference)} />
                    </label>
                </div>
                <div className="form-group">
                    <label className="required-field-label">Nome</label>
                    <input defaultValue={info.nome} type="text" className="form-control" id="nome" name="nome" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label">Cpf</label>
                    <input defaultValue={info.cpf} type="text" className="form-control" id="cpf" name="cpf" required />
                </div>
                <div className="form-group">
                    <label className="required-field-label ">E-mail</label>
                    <input defaultValue={info.email} type="email" className="form-control" id="email" name="email" required />
                </div>
                <div className="buttonContainer">
                    <button className='modalButtonClose' type='button' onClick={() => closeModal(modalToggle, setSucess, setError)} >Fechar</button>
                    <button className='modalButtonSave' type="submit" disabled={loading}>Salvar alterações</button>
                </div>
            </form>
        </Modal>
    );
};

export default EditarUsuariosModal;
