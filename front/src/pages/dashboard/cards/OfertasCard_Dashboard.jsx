import { useQueryOfertas, useQueryMinhaLoja } from "@/hooks/ReactQuery/useQueryOfertas";
import { motion } from "framer-motion";
import { time } from "./constant";

// GET /ofertas (marketplace) exclui a própria oferta do requisitante — certo
// pra tela de marketplace, mas subcontaria "Unidade"/"Geral" aqui. Soma de
// volta via GET /ofertas/minha-loja (nunca exclui, mas inclui fechada/
// pausada — filtra só as abertas pra bater com o critério do marketplace).
const OfertasCard_Dashboard = () => {
    const { data: outrasResp } = useQueryOfertas()
    const { data: minhaLojaResp } = useQueryMinhaLoja()

    const outras = outrasResp?.data ?? []
    const minhasAbertas = (minhaLojaResp?.data ?? []).filter((o) => o.status === 'aberta')

    const geral = [...outras, ...minhasAbertas]
    const unidade = minhasAbertas

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, translate: 0 }}
            transition={{ duration: 0.7, delay: time * 0.2 }}
            exit={{ opacity: 0, scale: 0 }}
            className="homeCard"
        >
            <div className="homeCardItem">
                <h3 className="homeCardItemHeader">Ofertas</h3>
                <div className="homeCardItemBody">
                    <div>
                        <p>Unidade</p>
                        <p>{unidade.length}</p>
                    </div>
                    <div>
                        <p>Geral</p>
                        <p>{geral.length}</p>
                    </div>
                </div>
            </div>
            <div className="homeCardBar" />
        </motion.div>
    )
};

export default OfertasCard_Dashboard;
