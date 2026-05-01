import { getApiData } from "@/hooks/ListasHook";
import { getId } from "@/hooks/getId";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { time } from "./constant";
import { formatarNumeroParaReal } from "@/utils/functions/formartNumber";

const PermutasCard_Dashboard = () => {
    const [geral, setGeral] = useState({});
    const [unidade, setUnidade] = useState({});
    useEffect(() => {
        getApiData("dashboard/total-valor-rt", setGeral)
        getApiData(`dashboard/total-valor-rt-por-unidade/${getId()}`, setUnidade)
    }, []);

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
                        <p>
                            {unidade && unidade.valorTotalTransacoes ?
                                <>RT$ {formatarNumeroParaReal(unidade.valorTotalTransacoes)} </>
                                :
                                <>RT$ 0 </>
                            }
                        </p>
                    </div>
                    <div>
                        <p>Geral</p>
                        <p>
                            {geral && geral.totalValorRT ?
                                <>RT$ {formatarNumeroParaReal(geral.totalValorRT)}</>
                                :
                                <>RT$ 0 </>
                            }
                        </p>
                    </div>
                </div>
            </div>
            <div className="homeCardBar"></div>
        </motion.div>
    )
};

export default PermutasCard_Dashboard;
