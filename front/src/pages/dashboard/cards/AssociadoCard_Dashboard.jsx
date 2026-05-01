import { useQueryAssociados } from "@/hooks/ReactQuery/useQueryAssociados";
import { motion } from "framer-motion";
import { useQueryMeusAssociados } from "@/hooks/ReactQuery/useQueryMeusAssociados";
const AssociadoCard_Dashboard = () => {
  const { data: associados } = useQueryMeusAssociados();
  const { data } = useQueryAssociados();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, translate: 0 }}
      transition={{ duration: 0.7 }}
      exit={{ opacity: 0, scale: 0 }}
      className="homeCard"
    >
      <div className="homeCardItem">
        <h3 className="homeCardItemHeader">Associados</h3>
        <div className="homeCardItemBody">
          <div>
            <p>Unidade</p>
            <p>{associados && associados.length ? associados.length : 0}</p>
          </div>
          <div>
            <p>Geral</p>
            <p>{data && data.data ? data.data.length : 0}</p>
          </div>
        </div>
      </div>
      <div className="homeCardBar" />
    </motion.div>
  );
};

export default AssociadoCard_Dashboard;
