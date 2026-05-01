import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { formatDate } from "@/hooks/ListasHook";
import { activePage } from "@/utils/functions/setActivePage";
import RealInput from "@/components/Inputs/CampoMoeda";

const OfertasInfo = () => {
    const [reference, setReference] = useState(true)
    const storedData = JSON.parse(localStorage.getItem("ofertaCard"));
    const formatarNumeroParaReal = (numero) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numero);
    };
    useEffect(() => {
        activePage("ofertas")
    }, []);
    return (
        <div className="container">
            <div className="containerHeader">Informações da Oferta</div>
            <div className="associadoInfoContainer">
                <h1>{storedData.titulo}</h1>
                <div className="associadoInfo ofertasInfo">
                    <div className="ofertasImage">
                        <img src={storedData.imagens[0] ? storedData.imagens[0] : "https://cdn.vectorstock.com/i/preview-1x/65/30/default-image-icon-missing-picture-page-vector-40546530.jpg"} alt="" />
                    </div>
                    <div className="associadoInfoItens">
                        <h2 className="associadoInfoCategoria ofertasInfoH2">
                            {formatDate(storedData.vencimento, "full")}</h2>
                        <div className="ofertasInfoValor">
                            <p>RT$ {formatarNumeroParaReal(storedData.valor)}</p>
                            <div>
                                <RealInput name="limiteCredito" placeholder="Quantidade da permuta" reference={reference} required />
                                <button>Permultar</button>
                            </div>
                        </div>
                        <div className="ofertasInfoInfo">
                            <h3>Informações:</h3>
                            <p><span>Vendido por:</span> {storedData.nomeUsuario ? storedData.nomeUsuario : "Ninguem"}</p>
                            <p><span>Cidade:</span> {storedData.cidade}</p>
                            <p><span>Agência:</span> {storedData.nomeAgencia ? storedData.nomeAgencia : "Nenhuma"}</p>
                            <p><span>Tipo:</span> {storedData.tipo}</p>
                        </div>
                        <div>
                            <h3>Descrição da Oferta</h3>
                            <p>{storedData.descricao}</p>
                        </div>
                        <div>
                            <h3>Observações</h3>
                            <p>{storedData.obs ? storedData.obs : "Nenhuma"}</p>
                        </div>
                        <h2 className={storedData.status ? "associadoInfoStatus" : "associadoInfoStatus disabled"}>{storedData.status ? "Oferta Ativa" : "Oferta Desativada"}</h2>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default OfertasInfo;
