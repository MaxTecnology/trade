import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { formatDate } from "@/hooks/ListasHook";
import { activePage } from "@/utils/functions/setActivePage";
import api from "@/services/api";
import { toast } from "sonner";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import defaultImg from "@/assets/images/default_img.png";

const OfertasInfo = () => {
    const [quantidade, setQuantidade] = useState(1);
    const [loading, setLoading] = useState(false);
    const storedData = JSON.parse(localStorage.getItem("ofertaCard"));
    const revalidate = useRevalidate();
    const formatarNumeroParaReal = (numero) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numero);
    };
    useEffect(() => {
        activePage("ofertas")
    }, []);

    const handlePermuta = (event) => {
        event.preventDefault()
        setLoading(true)
        toast.promise(
            api.post('transacoes/permuta', { ofertaId: storedData.id, quantidade: Number(quantidade), parcelas: 1 })
                .then(() => { setLoading(false); revalidate("ofertas") })
                .catch((err) => {
                    setLoading(false)
                    throw new Error(err?.response?.data?.error?.message ?? "Erro ao realizar permuta")
                }),
            {
                loading: 'Realizando permuta...',
                success: 'Permuta realizada com sucesso!',
                error: (error) => error.message,
            }
        )
    }

    return (
        <div className="container">
            <div className="containerHeader">Informações da Oferta</div>
            <div className="associadoInfoContainer">
                <h1>{storedData.titulo}</h1>
                <div className="associadoInfo ofertasInfo">
                    <div className="ofertasImage">
                        <img src={storedData.imagemUrl ? storedData.imagemUrl : defaultImg} alt="" />
                    </div>
                    <div className="associadoInfoItens">
                        <h2 className="associadoInfoCategoria ofertasInfoH2">
                            {storedData.vencimento ? formatDate(storedData.vencimento, "full") : "Sem vencimento"}</h2>
                        <div className="ofertasInfoValor">
                            <p>RT$ {formatarNumeroParaReal(storedData.valorRT)}</p>
                            <form onSubmit={handlePermuta}>
                                <input
                                    type="number"
                                    min="1"
                                    max={storedData.quantidadeDisponivel}
                                    placeholder="Quantidade"
                                    value={quantidade}
                                    onChange={(e) => setQuantidade(e.target.value)}
                                    required
                                />
                                <button type="submit" disabled={loading}>Permutar</button>
                            </form>
                        </div>
                        <div className="ofertasInfoInfo">
                            <h3>Informações:</h3>
                            <p><span>Vendido por:</span> {storedData.associado?.nome ?? "Ninguem"}</p>
                            <p><span>Cidade:</span> {storedData.cidade}</p>
                            <p><span>Tipo:</span> {storedData.tipoAtendimento?.join(', ')}</p>
                            <p><span>Disponível:</span> {storedData.quantidadeDisponivel}</p>
                        </div>
                        <div>
                            <h3>Descrição da Oferta</h3>
                            <p>{storedData.descricao}</p>
                        </div>
                        <h2 className={storedData.status === 'aberta' ? "associadoInfoStatus" : "associadoInfoStatus disabled"}>{storedData.status === 'aberta' ? "Oferta Ativa" : "Oferta Desativada"}</h2>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default OfertasInfo;
