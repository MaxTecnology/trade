import { useQueryAssociados } from "@/hooks/ReactQuery/useQueryAssociados";
import { useQueryMeusAssociados } from "@/hooks/ReactQuery/useQueryMeusAssociados";
import { isMatriz } from "@/hooks/getId";
import { motion } from "framer-motion";

// "Unidade" = associados que a própria entidade logada cadastrou/gerencia
// diretamente; "Geral" = todos. GET /associados já vem escopado no backend
// pra quem não é superadmin (agency_admin só vê os próprios) — só Matriz
// precisa separar "diretos" (sem agência) do total na mesma resposta.
const AssociadoCard_Dashboard = () => {
  const { data: geralResp } = useQueryAssociados();
  const { data: meusResp } = useQueryMeusAssociados(!isMatriz());

  const geral = geralResp?.data ?? [];
  const unidade = isMatriz() ? geral.filter((a) => !a.agenciaId) : (meusResp?.data ?? []);

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
  );
};

export default AssociadoCard_Dashboard;
