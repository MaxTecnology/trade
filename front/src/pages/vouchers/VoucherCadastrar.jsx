import { useEffect, useState } from "react";
import Mascaras from "@/hooks/Mascaras";
import { createT } from "@/hooks/ListasHook";
import { useNavigate } from "react-router-dom";
import { getName } from "@/hooks/getId";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import RealInput from '@/components/Inputs/CampoMoeda';
import AssociadosDiretorioOptions from "@/components/Options/AssociadosDiretorioOptions";
import { toast } from "sonner";

// Mesma negociação direta de TransaçãoCadastrar.jsx, filtrada para associados
// que atendem por voucher (tipoAtendimento inclui "voucher").
const VoucherCadastrar = () => {
    const [reference, setReference] = useState(true)
    const [vendedor, setVendedor] = useState("")
    useEffect(() => {
        activePage("voucher")
        Mascaras()
    }, []);

    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/voucher")
    }

    const formHandler = (event) => {
        event.preventDefault()
        setReference(false);
        const formValue = new FormData(event.target)
        toast.promise(createT(formValue), {
            loading: 'Cadastrando voucher...',
            success: () => {
                event.target.reset()
                setVendedor("")
                setReference(true)
                return "Voucher cadastrado com sucesso!"
            },
            error: (err) => {
                setReference(true)
                return err.message ?? "Erro ao cadastrar voucher"
            },
        })
    }

    return (
        <div className="container">
            <div className="containerHeader">Solicitar Voucher</div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm transacoesContainer">
                <div className="transacoesItens">
                    <div className="form-group f2">
                        <label className="required">Comprador</label>
                        <input readOnly defaultValue={getName()} type="text" className="form-control readOnly" name="nomeComprador" required />
                    </div>
                    <div className="form-group f2">
                        <label className="required">Vendedor</label>
                        <select
                            required
                            value={vendedor ? JSON.stringify(vendedor) : ""}
                            onChange={(event) => { setVendedor(JSON.parse(event.target.value)) }}
                        >
                            <option value="" disabled>
                                Selecione
                            </option>
                            <AssociadosDiretorioOptions voucher />
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="required">Valor RT$</label>
                        <RealInput name="valorRT" placeholder="Valor RT$" required reference={reference} />
                    </div>
                </div>

                <div className="transacoesDesc">
                    <div className="form-group desc">
                        <label>Descrição</label>
                        <textarea name="descricao" rows={9} />
                    </div>
                </div>
                <input readOnly style={{ display: "none" }} type="text" name="parcelas" value={1} />
                <input type="hidden" name="vendedorId" value={vendedor ? vendedor.id : ""} />
                <div className="buttonContainer">
                    <button className="confirmButton" type="submit">Cadastrar</button>
                    <button onClick={handleclick} type="button">Voltar</button>
                </div>
            </form>
            <Footer />
        </div>)
};

export default VoucherCadastrar;
