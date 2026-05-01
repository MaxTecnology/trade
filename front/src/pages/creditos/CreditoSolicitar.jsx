import { useEffect, useState } from "react";
import { formateValue } from "@/hooks/Mascaras";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { getId, getName } from "@/hooks/getId";
import RealInput from "@/components/Inputs/CampoMoeda";
import { activePage } from "@/utils/functions/setActivePage";
import { toast } from "sonner";
import { requestCredit } from "@/hooks/ListasHook";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const CreditoSolicitar = () => {
    const [reference, setReference] = useState(true)
    useEffect(() => {
        formateValue()
        activePage("creditos")
    }, []);

    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/creditos")
    }
    const solicitar = (event) => {
        toast.promise(requestCredit(event, "creditos/solicitar"), {
            loading: 'Solicitando crédito...',
            success: () => {
                event.target.reset()
                setReference(false)
                setTimeout(() => {
                    setReference(true)
                }, 100)
                return "Credito solicitado com sucesso!"
            },
            error: () => {
                return "Algo de errado aconteceu"
            }
        })
    };

    return (
        <div className="container">
            <div className="containerHeader">Solicitar Credito</div>
            <form onSubmit={(event) => {
                event.preventDefault()
                setReference(false);
                setTimeout(() => {
                    solicitar(event)
                    setReference(true)
                }, 100);  // Aguarde 100 milissegundos (ou o tempo necessário)
            }} className="containerForm transacoesContainer">
                <div className="transacoesItens">
                    <div className="form-group">
                        <label className="required-field-label">Associado</label>
                        <input readOnly defaultValue={getName()} type="text" className="readOnly" required />
                        <input readOnly style={{ display: "none" }} defaultValue={getId()} type="text" className="readOnly" name="usuarioId" required />
                    </div>
                    <div className="form-group">
                        <label className="required-field-label">Valor R$</label>
                        <RealInput name="valorSolicitado" placeholder="Valor R$" required reference={reference} />
                    </div>
                    <div className="form-group">

                    </div>
                </div>
                <div className="transacoesDesc">
                    <div className="form-group desc">
                        <label>Descrição</label>
                        <textarea name="descricaoSolicitante" rows={9} />
                    </div>
                </div>
                <div className="buttonContainer">
                    <ButtonMotion onClick={handleclick} type="button">Voltar</ButtonMotion>
                    <ButtonMotion className="confirmButton" type="submit">Solicitar</ButtonMotion>
                </div>
            </form>
            <Footer />
        </div>)
};

export default CreditoSolicitar;
