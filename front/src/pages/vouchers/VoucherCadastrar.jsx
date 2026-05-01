import { useEffect, useState } from "react";
import Mascaras from "@/hooks/Mascaras";
import { createT } from "@/hooks/ListasHook";
import { useNavigate } from "react-router-dom";
import { getId, getName } from "@/hooks/getId";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import RealInput from '@/components/Inputs/CampoMoeda';
import UsuariosOptions from "@/components/Options/UsuariosOptions";
import { calcularDisponibilidade } from "@/utils/functions/calcularDisponibilidade";

const VoucherCadastrar = () => {
    const [reference, setReference] = useState(true)
    const [vendedor, setVendedor] = useState("")
    const [disponibilidade, setDisponibilidade] = useState(0)
    useEffect(() => {
        activePage("voucher")
        Mascaras()
    }, []);

    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/voucher")
    }


    useEffect(() => {
        if (vendedor.idUsuario) {
            setDisponibilidade(calcularDisponibilidade(vendedor.conta))
        }
    }, [vendedor]);


    const formHandler = (event) => {
        event.preventDefault()
        // setReference(false);
        setTimeout(() => {
            const formValue = new FormData(event.target)
            createT(formValue)
            setReference(true)
        }, 100);
    }


    return (
        <div className="container">
            <div className="containerHeader">Solicitar Voucher</div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm transacoesContainer">
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
                            <UsuariosOptions voucher />
                        </select>
                    </div>
                    <div className="form-group">
                        <div className="flex gap-2">
                            <label className="required">Valor RT$</label>
                            <span className={disponibilidade <= 0 ? "text-red-500" : "text-green-500"}>Valor máximo: {disponibilidade}</span>
                        </div>
                        <RealInput name="valorRt" placeholder="Valor RT$" required reference={reference} maxValue={disponibilidade} />
                    </div>
                </div>

                <div className="transacoesDesc">
                    <div className="form-group desc">
                        <label>Descrição</label>
                        <textarea name="descricao" rows={9} />
                    </div>
                </div>
                <input readOnly style={{ display: "none" }} type="text" name="numeroParcelas" value={1} />
                <input readOnly style={{ display: "none" }} type="text" name="observacaoNota" value={""} />
                <input readOnly style={{ display: "none" }} type="text" name="voucher" value={true} />
                <input readOnly style={{ display: "none" }} type="text" name="valorAdicional" value={0} />
                <input readOnly style={{ display: "none" }} type="text" name="notaAtendimento" value={5} />
                <input type="hidden" name="vendedorId" value={vendedor ? vendedor.idUsuario : ""} />
                <div className="buttonContainer">
                    <button className="confirmButton" type="submit">Cadastrar</button>
                    <button onClick={handleclick} type="button">Voltar</button>
                </div>
            </form>
            <Footer />
        </div>)
};

export default VoucherCadastrar;
