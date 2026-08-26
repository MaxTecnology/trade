import { useQueryOfertas } from "@/hooks/ReactQuery/useQueryOfertas";
import { motion } from "framer-motion";
import { time } from "./constant";
import state from "@/store";

// GET /ofertas é o marketplace público (mesma lista pra qualquer role) — dá
// pra separar "Unidade" (minhas ofertas) filtrando pela própria conta, sem
// precisar de um segundo endpoint.
const OfertasCard_Dashboard = () => {
    const { data } = useQueryOfertas()
    const geral = data?.data ?? []
    const minhaContaId = state.user?.conta?.id
    const unidade = geral.filter((o) => o.contaId === minhaContaId)

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
