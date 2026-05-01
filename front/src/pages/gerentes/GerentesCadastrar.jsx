import { useEffect, useState } from "react";
import InputMask from 'react-input-mask';
import { createUser } from "@/hooks/ListasHook";
import { ColorRing } from 'react-loader-spinner'
import defaultImage from "@/assets/images/default_img.png"
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import { BiSolidImageAdd } from "react-icons/bi";
import RealInput from "@/components/Inputs/CampoMoeda";
import { toast } from "sonner";
import InvisibleInputs from "@/components/Inputs/InvisibleInputs";
import { getId } from "@/hooks/getId";
import { imageReferenceHandler } from "@/utils/functions/formHandler";
import PlanosFields from "@/components/Form/PlanosFields";
import { useSnapshot } from "valtio";
import state from "@/store";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const GerentesCadastrar = () => {
    const snap = useSnapshot(state);
    const [reference, setReference] = useState(true)
    const [imagemReference, setImageReference] = useState(null);
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        activePage("gerentes")
    }, []);

    const revalidate = useRevalidate()

    const formHandler = (event) => {
        event.preventDefault()
        setReference(false);
        setTimeout(() => {
            toast.promise(createUser(event, "usuarios/criar-usuario"), {
                loading: 'Cadastrando Gerente...',
                success: () => {
                    revalidate("gerentes")
                    setReference(true)
                    setImageReference(null)
                    setLoading(false)
                    return "Gerente Cadastrado com sucesso!"
                },
                error: (error) => {
                    setLoading(false)
                    console.log(error)
                    return `Erro: ${error.message}`
                },
            })
            setReference(true)
        }, 100);  // Aguarde 100 milissegundos (ou o tempo específico)
    }

    return (
        <div className="container">
            <div className="containerHeader">Novo Gerente</div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm">
                <div className="form-group f4">
                    <label >Razão Social</label>
                    <input type="text" className="form-control" name="razaoSocial" />
                </div>
                <div className="form-group f4">
                    <label >Nome Fantasia</label>
                    <input type="text" className="form-control" name="nomeFantasia" />
                </div>
                <div className="form-group f2">
                    <label>CNPJ</label>
                    <InputMask mask="99.999.999/9999-99" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" name="cnpj" required />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Insc. Estadual</label>
                    <input type="text" className="form-control" id="inscEstadual" name="inscEstadual" />
                </div>
                <div className="form-group">
                    <label>Insc. Municipal</label>
                    <input type="text" className="form-control" id="inscMunicipal" name="inscMunicipal" />
                </div>
                {/* CONTATO */}
                <div className="formDivider">
                    <p>Contato</p>
                </div>
                {/* CONTATO */}
                <div className="form-group f2">
                    <label className="required">Nome</label>
                    <input type="text" className="form-control" id="nomeContato" name="nomeContato" required />
                </div>
                <div className="form-group f2">
                    <label>Telefone</label>
                    <InputMask mask="(99)9999-9999" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" id="telefone" name="telefone" required />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required">Celular</label>
                    <InputMask mask="(99)99999-9999" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" id="celular" name="celular" required />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required">E-mail</label>
                    <input type="email" className="form-control" id="emailContato" name="emailContato" required />
                </div>
                <div className="form-group f2">
                    <label>E-mail secundário</label>
                    <input type="email" className="form-control" id="emailSecundario" name="emailSecundario" />
                </div>
                {/* ENDEREÇO */}
                <div className="formDivider">
                    <p>Endereço</p>
                </div>
                {/* ENDEREÇO */}
                <div className="form-group">
                    <label className="required">Logradouro</label>
                    <input type="text" className="form-control" id="logradouro" name="logradouro" required />
                </div>
                <div className="form-group">
                    <label className="required">Número</label>
                    <input type="number" className="form-control" id="numero" name="numero" required />
                </div>
                <div className="form-group">
                    <label className="required">CEP</label>
                    <InputMask mask="99999-999" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" id="cep" name="cep" />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Complemento</label>
                    <input type="text" className="form-control" id="complemento" name="complemento" />
                </div>
                <div className="form-group">
                    <label className="required">Bairro</label>
                    <input type="text" className="form-control" id="bairro" name="bairro" required />
                </div>
                <div className="form-group f2">
                    <label className="required">Cidade</label>
                    <input type="text" className="form-control" id="cidade" name="cidade" required />
                </div>
                <div className="form-group f1">
                    <label className="required">Estado</label>
                    <input type="text" className="form-control" id="estado" name="estado" required />
                </div>
                <div className="form-group">
                    <label>Região</label>
                    <input type="text" className="form-control" id="regiao" name="regiao" />
                </div>
                {/* Unidade */}
                <div className="formDivider">
                    <p>Unidade</p>
                </div>
                {/* Unidade */}
                <PlanosFields type={"Gerente"} />
                <div className="form-group">
                    <label className="required">Nome da Agência </label>
                    <input type="text" className="readOnly" readOnly required value={snap.user.nomeFantasia} />
                </div>
                <div className="form-group">
                    <label className="required">Tipo de Operação</label>
                    <select defaultValue={""} className="form-control" name="tipoOperacao">
                        <option value="" disabled>Selecionar</option>
                        <option value={1}>Compra</option>
                        <option value={2}>Venda</option>
                        <option value={3}>Compra/Venda</option>
                    </select>
                </div>
                {/* ======================================================================================= */}
                {/* Operações */}
                {/* ======================================================================================= */}
                <div className="formDivider">
                    <p>Operações</p>
                </div>
                <div className="form-group f2">
                    <label className="required">Limite Crédito</label>
                    <RealInput name="limiteCredito" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group f2">
                    <label className="required">Taxa em % do Gerente</label>
                    <RealInput name="limiteCredito" placeholder="Insira o limite" reference={reference} required />
                </div>
                {/* <div className="form-group">
                    <label className="required">Limite de Venda Mensal</label>
                    <RealInput name="limiteVendaMensal" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label className="required">Limite de Venda Total</label>
                    <RealInput name="limiteVendaTotal" placeholder="Insira o limite" reference={reference} required />
                </div> */}
                {/* <div className="form-group">
                    <label className="required">Taxa repasse Matriz em %</label>
                    <input type="number" className="form-control" id="limiteCredito" name="taxaRepasseMatriz" required />
                </div> */}
                <div className="form-group f2">
                    <label className="required">Data Vencimento Fatura</label>
                    <select required className="form-control" id="dataVencimentoFatura" name="dataVencimentoFatura">
                        <option value="" disabled>Selecionar</option>
                        <option>10</option>
                        <option>20</option>
                        <option>30</option>
                    </select>
                </div>
                <div className="form-group f2">
                    <label className="required">Aceita Orçamento</label>
                    <select defaultValue={""} className="form-control" id="aceitaOrcamento" name="aceitaOrcamento">
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Sim</option>
                        <option value={false}>Não</option>
                    </select>
                </div>
                <div className="form-group f2">
                    <label className="required">Aceita Voucher</label>
                    <select defaultValue={""} className="form-control" id="aceitaVoucher" name="aceitaVoucher">
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Sim</option>
                        <option value={false}>Não</option>
                    </select>
                </div>
                {/* ======================================================================================= */}
                {/* DADOS USUÁRIO */}
                {/* ======================================================================================= */}
                <div className="formDivider">
                    <p>Dados do usuário</p>
                </div>
                <div className="formImage">
                    <img src={imagemReference ? imagemReference : defaultImage} className="rounded float-left img-fluid" alt="..." id="imagem-selecionada" />
                </div>
                <div className="form-group">
                    <label htmlFor="img_path" className="inputLabel">
                        <BiSolidImageAdd /> Selecione uma imagem
                        <input type="file" required accept="image/*" className="custom-file-input" id="img_path" onChange={(e) => imageReferenceHandler(e, setImageReference)} name="imagem" />
                    </label>
                </div>
                <div className="form-group">
                    <label className="required">Nome</label>
                    <input type="text" className="form-control" id="nome" name="nome" required />
                </div>
                <div className="form-group">
                    <label className="required">Cpf</label>
                    <InputMask mask="999.999.999-99" maskChar={null}>
                        {(inputProps) => <input  {...inputProps} type="text" className="form-control" id="cpf" name="cpf" required />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label className="required ">E-mail</label>
                    <input type="email" className="form-control" id="email" name="email" required />
                </div>
                <div className="form-group">
                    <label className="required ">Senha</label>
                    <input type="password" className="form-control" id="password" name="senha" required />
                </div>
                {/* ======================================================================================= */}
                {/* Invisible Inputs */}
                {/* ======================================================================================= */}
                <InvisibleInputs />
                <input readOnly style={{ display: "none" }} type="text" name="tipo" value="Gerente" />
                <input readOnly style={{ display: "none" }} type="text" name="gerente" value={getId()} />
                <input readOnly style={{ display: "none" }} type="text" name="status" value={true} />
                <input readOnly style={{ display: "none" }} type="text" name="usuarioCriadorId" value={getId()} />
                <input readOnly style={{ display: "none" }} type="number" name="nomeFranquia" value={snap.user.nomeFantasia} />
                <div className="buttonContainer">
                    {loading
                        ? <ColorRing
                            visible={loading}
                            height="80"
                            width="80"
                            ariaLabel="blocks-loading"
                            wrapperStyle={{}}
                            wrapperClass="blocks-wrapper"
                            colors={['#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf']}
                        />
                        : <ButtonMotion type="submit" className="purpleBtn">Cadastrar</ButtonMotion>}
                </div>
            </form>
            <Footer />
        </div>)
};

export default GerentesCadastrar;
