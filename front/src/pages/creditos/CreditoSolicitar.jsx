import { useEffect, useState } from "react";
import { formateValue } from "@/hooks/Mascaras";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { getName } from "@/hooks/getId";
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
        toast.promise(requestCredit(event, "creditos"), {
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
            <div className="containerHeader">Solicitar Aumento de Limite de Crédito</div>
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
                        <label className="required-field-label">Solicitante</label>
                        <input readOnly defaultValue={getName()} type="text" className="readOnly" required />
                    </div>
                    <div className="form-group">
                        <label className="required-field-label">Aumento de Limite (RT$)</label>
                        <RealInput name="valorSolicitado" placeholder="Aumento de Limite RT$" required reference={reference} />
                    </div>
                    <div className="form-group">

                    </div>
                </div>
                <div className="transacoesDesc">
                    <div className="form-group desc">
                        <label>Descrição</label>
                        <textarea name="descricao" rows={9} />
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
