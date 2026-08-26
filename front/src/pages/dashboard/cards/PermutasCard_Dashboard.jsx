import { motion } from "framer-motion";
import { time } from "./constant";
import { formatarNumeroParaReal } from "@/utils/functions/formartNumber";
import { useQueryPermutasMes } from "@/hooks/ReactQuery/dashboard/useQueryPermutasMes";

const PermutasCard_Dashboard = () => {
    const { valorUnidade, valorGeral } = useQueryPermutasMes();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, translate: 0 }}
            transition={{ duration: 0.7, delay: time * 0.4 }}
            exit={{ opacity: 0, scale: 0 }}
            className="homeCard"
        >
            <div className="homeCardItem">
                <h3 className="homeCardItemHeader">Permutas Mês</h3>
                <div className="homeCardItemBody">
                    <div>
                        <p>Unidade</p>
                        <p>RT$ {formatarNumeroParaReal(valorUnidade)}</p>
                    </div>
                    <div>
                        <p>Geral</p>
                        <p>RT$ {formatarNumeroParaReal(valorGeral)}</p>
                    </div>
                </div>
            </div>
            <div className="homeCardBar"></div>
        </motion.div>
    )
};

export default PermutasCard_Dashboard;
