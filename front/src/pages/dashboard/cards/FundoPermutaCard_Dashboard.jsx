import { getApiData } from "@/hooks/ListasHook";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { time } from "./constant";
import { formatarNumeroParaReal } from "@/utils/functions/formartNumber";
import { useQueryFundoPermuta } from "@/hooks/ReactQuery/dashboard/useQueryFundoPermuta";

const FundoPermutaCard_Dashboard = () => {
    const [geral, setGeral] = useState({});
    const { data: unidade } = useQueryFundoPermuta()
    useEffect(() => {
        getApiData("dashboard/total-fundo-permuta-matriz/1", setGeral)
    }, []);

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
                        <p>
                            {unidade && unidade.valorFundoPermutaUnidade ?
                                <>
                                    RT$ {formatarNumeroParaReal(unidade.valorFundoPermutaUnidade)}
                                </>
                                :
                                <>
                                    RT$ 0
                                </>
                            }
                        </p>
                    </div>
                    <div>
                        <p>Geral</p>
                        <p>
                            {geral && geral.valorFundoPermutaTotal ?
                                <>
                                    RT$ {formatarNumeroParaReal(geral.valorFundoPermutaTotal)}
                                </>
                                :
                                <>
                                    RT$ 0
                                </>
                            }
                        </p>
                    </div>
                </div>
            </div>
            <div className="homeCardBar"></div>
        </motion.div>
    )
};

export default FundoPermutaCard_Dashboard;
