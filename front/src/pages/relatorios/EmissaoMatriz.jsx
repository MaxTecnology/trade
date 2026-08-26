import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import { activePage } from "../../utils/functions/setActivePage";
import { formatarNumeroParaReal } from "@/utils/functions/formartNumber";
import { useQueryEmissaoMatriz } from "@/hooks/ReactQuery/relatorios/useQueryEmissaoMatriz";

const RT = (valor) => `RT$ ${formatarNumeroParaReal(Number(valor ?? 0))}`;

const StatCard = ({ titulo, valor, sub, destaque }) => (
    <div className={`flex flex-col gap-2 rounded border p-4 bg-white ${destaque ? "border-[#002752] border-2" : "border-[rgba(0,0,0,0.125)]"}`}>
        <h3 className="text-base font-medium m-0">{titulo}</h3>
        <p className="text-xl font-semibold m-0">{valor}</p>
        {sub ? <p className="text-sm text-gray-500 m-0">{sub}</p> : null}
    </div>
);

const EmissaoMatriz = () => {
    const [pendente, setPendente] = useState({ dataInicio: "", dataFim: "" });
    const [filtros, setFiltros] = useState({ dataInicio: "", dataFim: "" });
    const { data } = useQueryEmissaoMatriz(filtros);
    const resumo = data?.data;

    useEffect(() => {
        activePage("contas");
    }, []);

    return (
        <div className="container">
            <div className="containerHeader">Emissão de RT</div>

            <div className="containerSearch">
                <div className="flex gap-3 items-end p-4 flex-wrap">
                    <div>
                        <label className="block text-sm">Data Início</label>
                        <input
                            type="date"
                            value={pendente.dataInicio}
                            onChange={(e) => setPendente({ ...pendente, dataInicio: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm">Data Fim</label>
                        <input
                            type="date"
                            value={pendente.dataFim}
                            onChange={(e) => setPendente({ ...pendente, dataFim: e.target.value })}
                        />
                    </div>
                    <button type="button" onClick={() => setFiltros(pendente)}>
                        Filtrar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setPendente({ dataInicio: "", dataFim: "" });
                            setFiltros({ dataInicio: "", dataFim: "" });
                        }}
                    >
                        Limpar (histórico completo)
                    </button>
                </div>
            </div>

            {resumo ? (
                <div className="containerList">
                    <div className="grid gap-3 p-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                        <StatCard titulo="Circulação Atual" valor={RT(resumo.circulacaoAtual)} sub="RT existente hoje — ignora o período" />
                        <StatCard
                            titulo="Injeção Direta"
                            valor={RT(resumo.injecaoDireta.total)}
                            sub={`${resumo.injecaoDireta.quantidade} operações`}
                        />
                        <StatCard
                            titulo="Queima"
                            valor={RT(resumo.queima.total)}
                            sub={`${resumo.queima.quantidade} cobranças quitadas`}
                        />
                        <StatCard
                            titulo="Compra da Matriz"
                            valor={RT(resumo.compraMatriz.total)}
                            sub="informativo — não entra na emissão líquida"
                        />
                        <StatCard
                            titulo="Limite Aprovado"
                            valor={RT(resumo.limiteAprovado.total)}
                            sub={`${resumo.limiteAprovado.quantidade} solicitações — não injeta RT, só aumenta o teto`}
                        />
                        <StatCard titulo="Emissão Líquida" valor={RT(resumo.emissaoLiquida)} sub="injeção direta − queima" destaque />
                    </div>
                </div>
            ) : null}

            <Footer />
        </div>
    );
};

export default EmissaoMatriz;
