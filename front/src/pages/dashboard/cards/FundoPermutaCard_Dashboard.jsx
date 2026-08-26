import { motion } from "framer-motion";
import { time } from "./constant";
import { formatarNumeroParaReal } from "@/utils/functions/formartNumber";
import { useQueryAgencias } from "@/hooks/ReactQuery/useQueryAgencias";
import { useQueryAssociados } from "@/hooks/ReactQuery/useQueryAssociados";
import { useQueryMeusAssociados } from "@/hooks/ReactQuery/useQueryMeusAssociados";
import { isMatriz } from "@/hooks/getId";

const somaLimiteCredito = (items) =>
    (items ?? []).reduce((soma, item) => soma + Number(item.limiteCredito ?? 0), 0);

// Fundo de Permutas = limite de crédito liberado às agências, associados e
// gerentes (gerente é um Associado, já entra na soma de associados). "Geral"
// = tudo; "Unidade" (Matriz) = todas as agências (ela cria todas direto) +
// associados/gerentes sem agência (diretos dela); "Unidade" (Agência) = só
// os próprios associados (ela não libera crédito pra outra agência).
const FundoPermutaCard_Dashboard = () => {
    const { data: agencias } = useQueryAgencias(isMatriz());
    const { data: associadosResp } = useQueryAssociados();
    const { data: meusResp } = useQueryMeusAssociados(!isMatriz());

    const associados = associadosResp?.data ?? [];
    const somaAgencias = somaLimiteCredito(agencias);
    const somaAssociados = somaLimiteCredito(associados);

    const geral = somaAgencias + somaAssociados;
    const unidade = isMatriz()
        ? somaAgencias + somaLimiteCredito(associados.filter((a) => !a.agenciaId))
        : somaLimiteCredito(meusResp?.data ?? []);

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
