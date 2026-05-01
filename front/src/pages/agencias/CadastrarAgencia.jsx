import { useCallback, useEffect, useState } from "react";
import InputMask from 'react-input-mask';
import { createUser, } from "@/hooks/ListasHook";
import { ColorRing } from 'react-loader-spinner'
import defaultImage from "@/assets/images/default_img.png"
import Footer from '@/components/Footer';
import RealInput from "@/components/Inputs/CampoMoeda";
import { activePage } from "@/utils/functions/setActivePage";
import { BiSolidImageAdd } from "react-icons/bi";
import { toast } from "sonner";
import InvisibleInputs from "@/components/Inputs/InvisibleInputs";
import { getId } from "@/hooks/getId";
import PlanosFields from "@/components/Form/PlanosFields";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";

const CadastrarAgencia = () => {
    const [imagemReference, setImageReference] = useState(null);
    const [reference, setReference] = useState(true)
    const [loading, setLoading] = useState(false)

    const handleImagemChange = useCallback((event) => {
        const arquivo = event.target.files[0];
        if (arquivo) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageReference(e.target.result)
            };
            reader.readAsDataURL(arquivo);
        }
    }, [])

    useEffect(() => {
        activePage("agencias")
    }, []);

    const revalidate = useRevalidate("agencias")

    const formHandler = (event) => {
        event.preventDefault()
        setReference(false);
        setTimeout(() => {
            toast.promise(createUser(event, "usuarios/criar-usuario"), {
                loading: 'Cadastrando Agência...',
                success: () => {
                    setReference(true)
                    setImageReference(null)
                    revalidate("agencias")
                    setLoading(false)
                    return "Agência Cadastrada com sucesso!"
                },
                error: (error) => {
                    // setReference(true)
                    setLoading(false)
                    return `Erro: ${error.message}`
                },
            })
        }, 100);  // Aguarde 100 milissegundos (ou o tempo específico)
    }

    return (
        <div className="container">
            <div className="containerHeader">Cadastrar Agência</div>
            <form onSubmit={(event) => formHandler(event)}
                className="containerForm">
                <div className="form-group f2">
                    <label className="required">Razão Social</label>
                    <input type="text" className="form-control" id="razaoSocial" name="razaoSocial" required />
                </div>
                <div className="form-group f2">
                    <label className="required">Nome Fantasia</label>
                    <input type="text" className="form-control" id="nomeFantasia" name="nomeFantasia" required />
                </div>
                <div className="form-group f2">
                    <label className="required">CNPJ</label>
                    <InputMask mask="99.999.999/9999-99">
                        {(inputProps) => <input {...inputProps} type="text" id="cnpj" name="cnpj" required />}
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
                <div className="form-group">
                    <label className="required">Mostrar no site</label>
                    <select className="form-control" id="mostrarNoSite" name="mostrarNoSite" required>
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Sim</option>
                        <option value={false}>Não</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Tipo</label>
                    <select required className="form-control" name="tipo" defaultValue={""}>
                        <option value="" disabled>Selecionar</option>
                        <option value="Franquia Comum">Comum</option>
                        <option value="Franquia Master">Master</option>
                        <option value="Franquia Fillial">Filial</option>
                    </select>
                </div>
                <div className="formDivider">
                    <p>Contato</p>
                </div>

                {/* ======================================================================================= */}
                {/* CONTATO */}
                {/* ======================================================================================= */}
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

                {/* ======================================================================================= */}
                {/* ENDEREÇO */}
                {/* ======================================================================================= */}
                <div className="formDivider">
                    <p>Endereço</p>
                </div>
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
                {/* ======================================================================================= */}
                {/* Unidade */}
                {/* ======================================================================================= */}
                <div className="formDivider">
                    <p>Unidade</p>
                </div>
                <PlanosFields type={"Agencias"} />
                <div className="form-group">
                    <label className="required">Nome Franquia</label>
                    <input type="text" className="form-control" id="nomeFranquia" name="nomeFranquia" required />
                </div>
                <div className="formDivider">
                    <p>Operações</p>
                </div>
                {/* ======================================================================================= */}
                {/* Operações */}
                {/* ======================================================================================= */}
                <div className="form-group">
                    <label className="required">Limite Crédito</label>
                    <RealInput name="limiteCredito" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label className="required">Limite de Venda Mensal</label>
                    <RealInput name="limiteVendaMensal" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label className="required">Limite de Venda Total</label>
                    <RealInput name="limiteVendaTotal" placeholder="Insira o limite" reference={reference} required />
                </div>
                <div className="form-group">
                    <label className="required">Taxa repasse Matriz em %</label>
                    <input type="number" className="form-control" name="taxaRepasseMatriz" required />
                </div>
                <div className="form-group">
                    <label className="required">Data Vencimento Fatura</label>
                    <select required className="form-control" id="dataVencimentoFatura" name="dataVencimentoFatura" defaultValue={""}>
                        <option value="" disabled>Selecionar</option>
                        <option>10</option>
                        <option>20</option>
                        <option>30</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Tipo de Operação</label>
                    <select defaultValue={""} className="form-control" id="tipoOperacao" name="tipoOperacao">
                        <option value="" disabled>Selecionar</option>
                        <option value={1}>Compra</option>
                        <option value={2}>Venda</option>
                        <option value={3}>Compra/Venda</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="required">Aceita Orçamento</label>
                    <select defaultValue={""} className="form-control" id="aceitaOrcamento" name="aceitaOrcamento">
                        <option value="" disabled>Selecionar</option>
                        <option value={true}>Sim</option>
                        <option value={false}>Não</option>
                    </select>
                </div>
                <div className="form-group">
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
                    <img src={imagemReference ? imagemReference : defaultImage} className="rounded float-left img-fluid" alt="..." id="imagem-selecionada" name="imagem-selecionada" />
                </div>
                <div className="form-group">
                    <label htmlFor="img_path" className="inputLabel">
                        <BiSolidImageAdd /> Selecione uma imagem
                        <input type="file" id="img_path" name="imagem" required accept="image/*" className="custom-file-input" onChange={handleImagemChange} />
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
                {/* DADOS USUÁRIO */}
                {/* ======================================================================================= */}
                <InvisibleInputs />
                <input readOnly style={{ display: "none" }} type="text" name="gerente" value={getId()} />
                <input readOnly style={{ display: "none" }} type="text" name="statusConta" value={true} />
                <input readOnly style={{ display: "none" }} type="text" name="status" value={true} />
                <input readOnly style={{ display: "none" }} type="text" name="usuarioCriadorId" value={getId()} />
                <div className="buttonContainer">
                    {loading
                        ? <ColorRing
                            visible={loading}
                            height="33"
                            width="33"
                            ariaLabel="blocks-loading"
                            wrapperStyle={{}}
                            wrapperClass="blocks-wrapper"
                            colors={['#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf']}
                        />
                        : <button className="purpleBtn" type="submit">Cadastrar</button>}
                </div>
            </form>
            <Footer />
        </div>)
};

export default CadastrarAgencia;
