import { useEffect, useState } from "react";
import { updateUser } from "@/hooks/ListasHook";
import { ColorRing } from 'react-loader-spinner'
import defaultImage from "@/assets/images/default_img.png"
import Footer from "@/components/Footer";
import RealInput from "@/components/Inputs/CampoMoeda";
import { BiSolidImageAdd } from "react-icons/bi";
import { activePage } from "@/utils/functions/setActivePage";
import InputMask from 'react-input-mask';
import SubCategoriesOptions from "@/components/Options/SubCategoriesOptions";
import CategoriesOptions from "@/components/Options/CategoriesOptions";
import { toast } from "sonner";
import { useSnapshot } from "valtio";
import state from "@/store";
import { imageReferenceHandler } from "@/utils/functions/formHandler";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import PlanosFields from "@/components/Form/PlanosFields";
import { getType } from "@/hooks/getId";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const UsuariosDados = () => {
    const userInfo = useSnapshot(state.user)
    const [imagemReference, setImageReference] = useState(null);
    const [reference, setReference] = useState(true)
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        activePage("usuarios")
    }, []);

    const revalidate = useRevalidate()

    const isURL = (str) => {
        try {
            new URL(str);
            return true;
        } catch (_) {
            return false;
        }
    };

    const imageUrl = isURL(userInfo.imagem) ? userInfo.imagem : defaultImage;

    const formHandler = (event) => {
        event.preventDefault()
        setTimeout(() => {
            toast.promise(updateUser(event), {
                loading: 'Atualizando dados...',
                success: () => {
                    setLoading(false)
                    revalidate("login")
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
        <div className="container">
            <div className="containerHeader">Meus Dados</div>
            <form onSubmit={(event) => formHandler(event)}
                className="containerForm">
                <div className="form-group">
                    <label className="required">Razão Social</label>
                    <input type="text" className="readOnly" id="razaoSocial" required defaultValue={userInfo.razaoSocial} readOnly />
                </div>
                <div className="form-group">
                    <label className="required">Nome Fantasia</label>
                    <input type="text" className="readOnly" id="nomeFantasia" required defaultValue={userInfo.nomeFantasia} readOnly />
                </div>
                <div className="form-group">
                    <label className="required">Descrição</label>
                    <textarea className="readOnly" cols="30" rows="1" required defaultValue={userInfo.descricao} readOnly ></textarea>
                </div>
                <div className="form-group">
                    <label className="required">Status</label>
                    <select className="readOnly" required defaultValue={userInfo.status} disabled >
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Atendendo</option>
                        <option value={false}>Não Atendendo</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>CNPJ</label>
                    <InputMask mask="99.999.999/9999-99" maskChar={null} value={userInfo.cnpj || ""} readOnly>
                        {(inputProps) => <input {...inputProps} type="text" required className="readOnly" />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Insc. Estadual</label>
                    <input type="text" className="readOnly" defaultValue={userInfo.inscEstadual} readOnly />
                </div>
                <div className="form-group">
                    <label>Insc. Municipal</label>
                    <input type="text" className="readOnly" defaultValue={userInfo.inscMunicipal} readOnly />
                </div>
                <div className="form-group">
                    <label className="required">Restrições</label>
                    <textarea className="readOnly" defaultValue={userInfo.restricoes ? userInfo.restricoes : "Sem restrições"} cols="30" rows="1" required readOnly></textarea>
                </div>
                <div className="form-group">
                    <label>Categoria</label>
                    <select defaultValue={userInfo.categoria} className="readOnly" id="categoria" disabled>
                        <option value="" disabled>Selecionar</option>
                        <CategoriesOptions />
                    </select>
                </div>
                <div className="form-group">
                    <label>Subcategoria</label>
                    <select defaultValue={userInfo.subcategoria ? userInfo.subcategoria : ""} className="readOnly" disabled>
                        <option value="" disabled>Nenhuma</option>
                        <SubCategoriesOptions />
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Mostrar no site</label>
                    <select className="readOnly" required defaultValue={userInfo.mostrarSite} disabled>
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Sim</option>
                        <option value={false}>Não</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Tipo</label>
                    <select className="readOnly" id="tipo" required defaultValue={userInfo.tipo} disabled>
                        <option value="" disabled>Indefinido</option>
                        <option value={userInfo.tipo ? userInfo.tipo : "Indefinido"}>{userInfo.tipo ? userInfo.tipo : "Indefinido"}</option>
                    </select>
                </div>
                <div className="formDivider">
                    <p>Contato</p>
                </div>
                {/* CONTATO */}
                <div className="form-group f2">
                    <label className="required">Nome</label>
                    <input type="text" className="readOnly" required defaultValue={userInfo.nomeContato} />
                </div>
                <div className="form-group f2">
                    <label>Telefone</label>
                    <InputMask mask="(99)9999-9999" maskChar={null} readOnly value={userInfo.telefone}>
                        {(inputProps) => <input {...inputProps} type="text" className="readOnly" id="telefone" required />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required">Celular</label>
                    <InputMask mask="(99)99999-9999" maskChar={null} value={userInfo.celular} readOnly>
                        {(inputProps) => <input {...inputProps} type="text" className="readOnly" required />}
                    </InputMask>

                </div>
                <div className="form-group f2">
                    <label className="required">E-mail</label>
                    <input type="email" className="readOnly" disabled defaultValue={userInfo.email} required />
                </div>
                <div className="form-group f2">
                    <label>E-mail secundário</label>
                    <input type="email" className="readOnly" disabled defaultValue={userInfo.emailSecundario} />
                </div>
                <div className="form-group f2">
                    <label>Site</label>
                    <input type="text" className="readOnly" disabled defaultValue={userInfo.site} />
                </div>
                <div className="formDivider">
                    <p>Endereço</p>
                </div>
                {/* ENDEREÇO */}
                <div className="form-group">
                    <label className="required">Logradouro</label>
                    <input type="text" className="readOnly" disabled defaultValue={userInfo.logradouro} required />
                </div>
                <div className="form-group">
                    <label className="required">Número</label>
                    <input type="number" className="readOnly" disabled defaultValue={userInfo.numero} required />
                </div>
                <div className="form-group">
                    <label className="required">CEP</label>
                    <InputMask mask="99999-999" maskChar={null} value={userInfo.cep} readOnly>
                        {(inputProps) => <input {...inputProps} type="text" id="cep" className="readOnly" />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Complemento</label>
                    <input type="text" className="readOnly" disabled defaultValue={userInfo.complemento} />
                </div>
                <div className="form-group">
                    <label className="required">Bairro</label>
                    <input type="text" className="readOnly" disabled defaultValue={userInfo.bairro} required />
                </div>
                <div className="form-group f2">
                    <label className="required">Cidade</label>
                    <input type="text" className="readOnly" disabled defaultValue={userInfo.cidade} required />
                </div>
                <div className="form-group f1">
                    <label className="required">Estado</label>
                    <input type="text" className="readOnly" disabled defaultValue={userInfo.estado} required />
                </div>
                <div className="form-group">
                    <label>Região</label>
                    <input type="text" className="readOnly" disabled defaultValue={userInfo.regiao} />
                </div>
                {
                    getType() === "Matriz" ? null :
                        <>
                            <div className="formDivider">
                                <p>Agência</p>
                            </div>
                            <PlanosFields type={getType()} defaultValue={userInfo} />
                            <div className="form-group">
                                <label className="required">Data Vencimento Fatura</label>
                                <select required
                                    className="readOnly" readOnly defaultValue={userInfo.conta.dataVencimentoFatura} disabled>
                                    <option value="" disabled>Selecionar</option>
                                    <option>10</option>
                                    <option>20</option>
                                    <option>30</option>
                                </select>
                            </div>
                        </>

                }
                <div className="formDivider">
                    <p>Operações</p>
                </div>
                {/* ===============================================================
                //======================= Operações
                =============================================================== */}
                <div className="form-group">
                    <label>Gerente de Conta</label>
                    <select defaultValue={userInfo.conta.gerenteContaId ? userInfo.conta.gerenteContaId : "Indefinido"} className="readOnly" required disabled>
                        <option value={userInfo.conta.gerenteContaId ? userInfo.conta.gerenteContaId : "Indefinido"}>
                            {userInfo.conta.gerenteContaId ? userInfo.conta.gerenteContaId : "Indefinido"}
                        </option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Taxa Gerente Conta em %</label>
                    <input type="number" className="readOnly" readOnly required />
                </div>
                <div className="form-group">
                    <label className="required">Tipo de Operação</label>
                    <select className="readOnly" defaultValue={userInfo.tipoOperacao} disabled >
                        <option value="" disabled>Selecionar</option>
                        <option value={1}>Compra</option>
                        <option value={2}>Venda</option>
                        <option value={3}>Compra/Venda</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Limite Crédito</label>
                    <RealInput defaultValue={userInfo.conta.limiteCredito} placeholder="Insira o limite" reference={reference} required readOnly className="readOnly" />
                </div>
                <div className="form-group">
                    <label className="required">Limite de Venda Mensal</label>
                    <RealInput defaultValue={userInfo.conta.limiteVendaMensal} placeholder="Insira o limite" reference={reference} required readOnly className="readOnly" />
                </div>
                <div className="form-group">
                    <label className="required">Limite de Venda Total</label>
                    <RealInput defaultValue={userInfo.conta.limiteVendaTotal} placeholder="Insira o limite" reference={reference} required readOnly className="readOnly" />
                </div>
                <div className="form-group">
                    <label>Aceita Orçamento</label>
                    <select className="readOnly" defaultValue={userInfo.aceitaOrcamento} disabled >
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Sim</option>
                        <option value={false}>Não</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Aceita Voucher</label>
                    <select className="readOnly" defaultValue={userInfo.aceitaVoucher} disabled >
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Sim</option>
                        <option value={false}>Não</option>
                    </select>
                </div>
                <div className="formDivider">
                    <p>Dados do usuário</p>
                </div>
                <div className="formImage">
                    <img src={imagemReference ? imagemReference : imageUrl} className="rounded float-left img-fluid" alt="..." id="imagem-selecionada" />
                </div>
                <div className="form-group">
                    <label htmlFor="img_path" className="inputLabel">
                        <BiSolidImageAdd /> Selecione uma imagem
                        <input type="file" id="img_path" name="imagem" accept="image/*" className="custom-file-input" onChange={(e) => imageReferenceHandler(e, setImageReference)} />
                    </label>
                </div>
                <div className="form-group">
                    <label className="required">Nome</label>
                    <input type="text" name="nome" required defaultValue={userInfo.nome} />
                </div>
                <div className="form-group">
                    <label className="required">Cpf</label>
                    <InputMask mask="999.999.999-99" maskChar={null} defaultValue={userInfo.cpf || ""}>
                        {(inputProps) => <input  {...inputProps} type="text" name="cpf" required />}
                    </InputMask>

                </div>
                <div className="form-group">
                    <label className="required ">E-mail</label>
                    <input type="email" name="email" required defaultValue={userInfo.email} />
                </div>
                <div className="buttonContainer">
                    {loading
                        ? <ColorRing
                            visible={loading}
                            height="33"
                            width="80"
                            ariaLabel="blocks-loading"
                            wrapperStyle={{}}
                            wrapperClass="blocks-wrapper"
                            colors={['#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf']}
                        />
                        : <ButtonMotion className="purpleBtn" type="submit">Atualizar</ButtonMotion>}
                </div>
            </form>
            <Footer />
        </div>)
};

export default UsuariosDados;
