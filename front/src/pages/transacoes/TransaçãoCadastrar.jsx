import { useEffect, useRef, useState } from "react";
import { createT } from "@/hooks/ListasHook";
import Footer from "@/components/Footer";
import { useNavigate } from 'react-router-dom';
import { getId, getName } from "@/hooks/getId";
import RealInput from "@/components/Inputs/CampoMoeda";
import { activePage } from "@/utils/functions/setActivePage";
import NovaTransaçãoModal from "@/Modals/NovaTransaçãoModal";
import UsuariosOptions from "@/components/Options/UsuariosOptions";
import CheckBoxInput from "@/components/Inputs/CheckBoxInput";
import { calcularDisponibilidade } from "@/utils/functions/calcularDisponibilidade";
import { toast } from "sonner";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import useModal from "@/hooks/useModal";

const TransaçãoCadastrar = () => {
    const [reference, setReference] = useState(true)
    const [vendedor, setVendedor] = useState("")
    const [disponibilidade, setDisponibilidade] = useState(0)
    const [voucher, setVoucher] = useState(false)
    const [formData, setFormData] = useState('');
    const [modal, modalToggle] = useModal()
    const url = "transacoes"
    const [rate, setRate] = useState(null)
    const [obs, setObs] = useState(null)
    // Crie uma ref para o formulário
    const formularioRef = useRef(null);

    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/transacoes")
    }

    useEffect(() => {
        activePage("transações")
    }, []);

    useEffect(() => {
        if (vendedor.idUsuario) {
            setDisponibilidade(calcularDisponibilidade(vendedor.conta))
        }
    }, [vendedor]);


    const sendItem = async (event, setRate) => {
        if (rate) {
            const form = formData
            form.append("notaAtendimento", rate)
            form.append("observacaoNota", obs)
            toast.promise(createT(form, url), {
                loading: 'Realizando Transação...',
                success: () => {
                    formularioRef.current.reset();
                    event.target.reset()
                    setReference(false)
                    setTimeout(() => {
                        setReference(true)
                    }, 100)
                    setVendedor("")
                    setRate("")
                    return "Transação efetuada com sucesso!"
                },
                error: (err) => {
                    console.log(err)
                    return "Erro ao efetuar transação"
                }
            })
        }
    }
    const formHandler = (event) => {
        event.preventDefault()
        setTimeout(() => {
            const form = new FormData(event.target);
            setFormData(form);
            modalToggle();
        }, 100);
    }
    return (
        <div className="container">
            <NovaTransaçãoModal isOpen={modal} setRate={setRate} modalToggle={modalToggle} sendItem={sendItem} setObs={setObs} />
            <div className="containerHeader">Nova Transação</div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm transacoesContainer" ref={formularioRef}>
                <div className="transacoesItens">
                    <div className="form-group f2">
                        <input readOnly style={{ display: "none" }} type="text" name="compradorId" value={getId()} required />
                        <label className="required">Comprador</label>
                        <input readOnly defaultValue={getName()} type="text" className="form-control readOnly" name="nomeComprador" required />
                    </div>
                    <div className="form-group f2">
                        <label className="required">Vendedor</label>
                        <select
                            required
                            value={vendedor}
                            onChange={(event) => { setVendedor(JSON.parse(event.target.value)) }}
                        >
                            <option value="" disabled>
                                Selecione
                            </option>
                            <UsuariosOptions voucher={voucher} />
                        </select>
                    </div>
                    <div className="form-group f2">
                        {/* <CheckBoxInput
                            label="Voucher"
                            name="voucher"
                            text="Transação com Voucher?"
                            value={voucher}
                            onChange={() => {
                                setVendedor("")
                                setDisponibilidade(0)
                            }}
                        /> */}
                        <input type="hidden" value={voucher} name="voucher" />
                    </div>
                    <div className="form-group">
                        <div className="flex gap-2">
                            <label className="required">Valor RT$</label>
                            <span className={disponibilidade <= 0 ? "text-red-500" : "text-green-500"}>Valor máximo: {disponibilidade}</span>
                        </div>
                        <RealInput name="valorRt" placeholder="Valor RT$" required reference={reference} maxValue={disponibilidade} />
                    </div>
                    <div className="form-group">
                        <label>Valor R$</label>
                        <RealInput name="valorAdicional" placeholder="Valor R$" reference={reference} />
                    </div>
                    <div className="form-group">
                        <label className="required">Número de Parcelas</label>
                        <select id="planoAssociado" defaultValue={""} name="numeroParcelas">
                            <option value="" disabled>
                                Selecione
                            </option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                        </select>
                    </div>
                </div>
                <div className="transacoesDesc">
                    <div className="form-group desc">
                        <label>Descrição</label>
                        <textarea name="descricao" rows={5} />
                    </div>
                </div>
                <input type="hidden" name="vendedorId" value={vendedor ? vendedor.idUsuario : ""} />
                <input type="hidden" name="nomeVendedor" value={vendedor ? vendedor.nomeFantasia : ""} />
                <div className="buttonContainer">
                    <ButtonMotion onClick={handleclick} type="button">Voltar</ButtonMotion>
                    <ButtonMotion className="confirmButton" type="submit">Enviar</ButtonMotion>
                </div>
            </form>
            <Footer />
        </div>)
};

export default TransaçãoCadastrar;
