import { useQueryOfertas } from "@/hooks/ReactQuery/useQueryOfertas";
import { getId } from "@/hooks/getId";
import { motion } from "framer-motion";
import { time } from "./constant";

const OfertasCard_Dashboard = () => {
    const { data } = useQueryOfertas()

    const filter = (data) => {
        var ofertas = []
        data.map((item) => {
            if (item.usuarioId === getId()) {
                ofertas.push(item)
            }
        })
        return ofertas
    }



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
                        <p>{data && data.ofertas ? filter(data.ofertas).length : 0}</p>
                    </div>
                    <div>
                        <p>Geral</p>
                        <p>{data && data.ofertas ? data.ofertas.length : 0}</p>
                    </div>
                </div>
            </div>
            <div className="homeCardBar" />
        </motion.div>
    )
};

export default OfertasCard_Dashboard;
