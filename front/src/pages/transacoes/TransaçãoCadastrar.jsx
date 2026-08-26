import { useEffect, useRef, useState } from "react";
import { createT } from "@/hooks/ListasHook";
import Footer from "@/components/Footer";
import { useNavigate } from 'react-router-dom';
import { getName, isMatriz } from "@/hooks/getId";
import RealInput from "@/components/Inputs/CampoMoeda";
import { activePage } from "@/utils/functions/setActivePage";
import NovaTransaçãoModal from "@/Modals/NovaTransaçãoModal";
import AssociadosDiretorioOptions from "@/components/Options/AssociadosDiretorioOptions";
import AgenciasOptions from "@/components/Options/AgenciasOptions";
import { toast } from "sonner";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import useModal from "@/hooks/useModal";

// Negociação direta, fora do marketplace de Ofertas — sempre em RT (não há
// valor em dinheiro real envolvido, ver AJUSTES.md). Vendedor pode ser
// Associado (padrão), Agência ou a própria Matriz — os dois últimos só
// aparecem pra quem é Matriz, já que GET /agencias (usado no seletor de
// Agência) é superadmin-only; pra Associado/Agência a tela continua igual
// a antes, só Associado como vendedor.
const TransaçãoCadastrar = () => {
    const [reference, setReference] = useState(true)
    const [vendedor, setVendedor] = useState("")
    const [vendedorTipo, setVendedorTipo] = useState("associado")
    const [formData, setFormData] = useState('');
    const [modal, modalToggle] = useModal()
    const [rate, setRate] = useState(null)
    const [obs, setObs] = useState(null)
    const formularioRef = useRef(null);

    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/transacoes")
    }

    useEffect(() => {
        activePage("transações")
    }, []);

    const sendItem = async (event, setRate) => {
        if (rate) {
            const form = formData
            form.append("notaAtendimento", rate)
            form.append("observacaoNota", obs)
            toast.promise(createT(form), {
                loading: 'Realizando Transação...',
                success: () => {
                    formularioRef.current.reset();
                    setReference(false)
                    setTimeout(() => {
                        setReference(true)
                    }, 100)
                    setVendedor("")
                    setRate("")
                    return "Transação efetuada com sucesso!"
                },
                error: (err) => err.message ?? "Erro ao efetuar transação",
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
                        <label className="required">Comprador</label>
                        <input readOnly defaultValue={getName()} type="text" className="form-control readOnly" name="nomeComprador" required />
                    </div>
                    {isMatriz() ? (
                        <div className="form-group f2">
                            <label className="required">Tipo de Vendedor</label>
                            <select
                                value={vendedorTipo}
                                onChange={(event) => {
                                    setVendedorTipo(event.target.value)
                                    setVendedor("")
                                }}
                            >
                                <option value="associado">Associado</option>
                                <option value="agencia">Agência</option>
                            </select>
                        </div>
                    ) : null}
                    {vendedorTipo !== "matriz" ? (
                        <div className="form-group f2">
                            <label className="required">Vendedor</label>
                            <select
                                required
                                value={
                                    vendedorTipo === "agencia"
                                        ? (vendedor?.id ?? "")
                                        // AssociadosDiretorioOptions usa o objeto inteiro
                                        // serializado como value da option (reaproveitado
                                        // também no cadastro de Voucher) — precisa comparar
                                        // do mesmo jeito aqui, senão o select nunca reconhece
                                        // a opção como selecionada e volta pra "Selecione"
                                        // visualmente, mesmo com o estado interno correto.
                                        : (vendedor ? JSON.stringify(vendedor) : "")
                                }
                                onChange={(event) => {
                                    // AgenciasOptions só manda o id puro (reaproveitado em várias
                                    // buscas que só precisam disso); AssociadosDiretorioOptions
                                    // manda o objeto inteiro serializado — trata os dois formatos.
                                    if (vendedorTipo === "agencia") {
                                        setVendedor({ id: event.target.value })
                                    } else {
                                        setVendedor(JSON.parse(event.target.value))
                                    }
                                }}
                            >
                                <option value="" disabled>
                                    Selecione
                                </option>
                                {vendedorTipo === "agencia" ? <AgenciasOptions /> : <AssociadosDiretorioOptions />}
                            </select>
                        </div>
                    ) : null}
                    <div className="form-group">
                        <label className="required">Valor RT$</label>
                        <RealInput name="valorRT" placeholder="Valor RT$" required reference={reference} />
                    </div>
                    <div className="form-group">
                        <label className="required">Número de Parcelas</label>
                        <select id="planoAssociado" defaultValue={"1"} name="parcelas">
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
                <input type="hidden" name="vendedorTipo" value={vendedorTipo} />
                {vendedorTipo !== "matriz" ? (
                    <input type="hidden" name="vendedorId" value={vendedor ? vendedor.id : ""} />
                ) : null}
                <input type="hidden" name="nomeVendedor" value={vendedorTipo === "matriz" ? "Matriz" : (vendedor ? (vendedor.nomeFantasia || vendedor.nome) : "")} />
                <div className="buttonContainer">
                    <ButtonMotion onClick={handleclick} type="button">Voltar</ButtonMotion>
                    <ButtonMotion className="confirmButton" type="submit">Enviar</ButtonMotion>
                </div>
            </form>
            <Footer />
        </div>)
};

export default TransaçãoCadastrar;
