import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { time } from "./constant";
import { formatarNumeroParaReal } from "@/utils/functions/formartNumber";
import { getApiData } from "@/hooks/ListasHook";

// GET /relatorios/fundo-permuta calcula Unidade (eu + meu grupo hierárquico
// — mesma regra dos outros cards do dashboard) e Geral (total do sistema)
// no backend — precisa ser assim porque limiteCredito é dado financeiro,
// não pode virar uma soma feita no front a partir de uma lista de outras
// contas (só endpoints administrativos expõem limiteCredito individual, e
// esses são bloqueados pra Associado comum).
const FundoPermutaCard_Dashboard = () => {
    const { data } = useQuery({
        queryKey: ['fundoPermuta'],
        queryFn: async () => getApiData('relatorios/fundo-permuta'),
    });

    const unidade = data?.data?.unidade ?? 0;
    const geral = data?.data?.geral ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, translate: 0 }}
            transition={{ duration: 0.7, delay: time * 0.6 }}
            exit={{ opacity: 0, scale: 0 }}
            className="homeCard"
        >
            <div className="homeCardItem">
                <h3 className="homeCardItemHeader">Fundo Permuta</h3>
                <div className="homeCardItemBody">
                    <div>
                        <p>Unidade</p>
                        <p>RT$ {formatarNumeroParaReal(unidade)}</p>
                    </div>
                    <div>
                        <p>Geral</p>
                        <p>RT$ {formatarNumeroParaReal(geral)}</p>
                    </div>
                </div>
            </div>
            <div className="homeCardBar"></div>
        </motion.div>
    )
};

export default FundoPermutaCard_Dashboard;
