import { useEffect, useState } from "react";
import { createSubAccount } from "@/hooks/ListasHook";
import { ColorRing } from 'react-loader-spinner'
import defaultImage from "@/assets/images/default_img.png"
import Footer from "@/components/Footer";
import { BiSolidImageAdd } from "react-icons/bi";
import { activePage } from "@/utils/functions/setActivePage";
import InputMask from 'react-input-mask';
import { toast } from "sonner";
import { imageReferenceHandler } from "@/utils/functions/formHandler";
import Select from 'react-select'
import { extrato, leitura, options, vendas, voucher } from "./constants";

const UsuariosCadastrar = () => {
    const [select, setSelect] = useState({
        atendimentos: [],
        comissoes: [],
        compras: [],
        conta: [],
        extratos: [],
        negociacoes: [],
        ofertas: [],
        usuarios: [],
        vendas: [],
        voucher: [],
    });
    const [imagemReference, setImageReference] = useState(null);
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        activePage("usuarios")
    }, []);

    const handleChange = (event, name) => {
        console.log(event[0].value)
        console.log(event.map((item) => item.value))
        setSelect({
            ...select,
            [name]: [
                event.map((item) => item.value)
            ]
        })
        console.log(select)
    }
    const formHandler = (event) => {
        event.preventDefault()
        setTimeout(() => {
            toast.promise(createSubAccount(event), {
                loading: 'Cadastrando Sub-Conta...',
                success: () => {
                    setImageReference(null)
                    return "Sub-Conta Cadastrada com sucesso!"
                },
                error: (error) => {
                    setLoading(false)
                    return `Erro: ${error.message}`
                },
            })
        }, 100);  // Aguarde 100 milissegundos (ou o tempo específico)
    }

    const colorStyles = {
        option: (styles, { data }) => {
            return {
                ...styles,
                color: data.color,
            }
        },
        multiValue: (styles, { data }) => {
            return {
                ...styles,
                backgroundColor: data.color,

            }
        },
        multiValueLabel: (styles, { data }) => {
            return {
                ...styles,
                color: "white",
            }
        }
    }
    return (
        <div className="container">
            <div className="containerHeader">Nova Sub-Conta</div>
            <form onSubmit={(event) => formHandler(event)}
                className="containerForm">
                <div className="formDivider">
                    <p>Dados do usuário</p>
                </div>
                <div className="formImage">
                    <img src={imagemReference ? imagemReference : defaultImage} className="rounded float-left img-fluid" alt="..." id="imagem-selecionada" />
                </div>
                <div className="form-group">
                    <label htmlFor="img_path" className="inputLabel">
                        <BiSolidImageAdd /> Selecione uma imagem
                        <input type="file" id="img_path" name="imagem" required accept="image/*" className="custom-file-input" onChange={(event) => imageReferenceHandler(event, setImageReference)} />
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
                <div className="formDivider">
                    <p>Permissões</p>
                </div>
                <div className="flex gap-[10px] flex-wrap w-full justify-between">
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Minha Conta</label>
                        <Select
                            isMulti
                            options={options}
                            className="w-full"
                            classNamePrefix="select"
                            name="conta"
                            value={select.conta}
                            styles={colorStyles}
                            onChange={(e) => handleChange(e, "conta")}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Meus Usuários </label>
                        <Select
                            isMulti
                            options={options}
                            className="w-full"
                            classNamePrefix="select"
                            name="usuarios"
                            value={select.usuarios}
                            styles={colorStyles}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Minhas Vendas</label>
                        <Select
                            isMulti
                            options={vendas}
                            styles={colorStyles}
                            className="w-full"
                            classNamePrefix="select"
                            name="vendas"
                            value={select.vendas}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Minhas Compras</label>
                        <Select
                            isMulti
                            options={vendas}
                            className="w-full"
                            styles={colorStyles}
                            classNamePrefix="select"
                            name="compras"
                            value={select.compras}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Meus Vouchers</label>
                        <Select
                            isMulti
                            options={voucher}
                            className="w-full"
                            styles={colorStyles}
                            classNamePrefix="select"
                            name="voucher"
                            value={select.voucher}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Minhas Ofertas</label>
                        <Select
                            isMulti
                            options={options}
                            className="w-full"
                            classNamePrefix="select"
                            name="ofertas"
                            value={select.ofertas}
                            styles={colorStyles}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Extratos</label>
                        <Select
                            isMulti
                            options={extrato}
                            className="w-full"
                            classNamePrefix="select"
                            styles={colorStyles}
                            name="extratos"
                            value={select.extratos}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Fatura</label>
                        <Select
                            isMulti
                            options={leitura}
                            className="w-full"
                            classNamePrefix="select"
                            styles={colorStyles}
                            name="fatura"
                            value={select.fatura}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Comissões</label>
                        <Select
                            isMulti
                            options={leitura}
                            className="w-full"
                            classNamePrefix="select"
                            styles={colorStyles}
                            name="comissoes"
                            value={select.comissoes}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Atendimentos</label>
                        <Select
                            isMulti
                            options={options}
                            className="w-full"
                            classNamePrefix="select"
                            name="atendimentos"
                            value={select.atendimentos}
                            styles={colorStyles}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-full  flex flex-col gap-2 flex-1 min-w-[400px]">
                        <label htmlFor="conta">Negociações</label>
                        <Select
                            isMulti
                            options={options}
                            className="w-full"
                            styles={colorStyles}
                            classNamePrefix="select"
                            name="negociacoes"
                            value={select.negociacoes}
                            onChange={handleChange}
                        />
                    </div>
                </div>
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

export default UsuariosCadastrar;
