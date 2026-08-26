import { useQueryAssociados } from "@/hooks/ReactQuery/useQueryAssociados";
import { useQueryMeusAssociados } from "@/hooks/ReactQuery/useQueryMeusAssociados";
import { isMatriz, isGerente, podeListarTodosAssociados } from "@/hooks/getId";
import { motion } from "framer-motion";
import state from "@/store";

// "Unidade" = associados que a própria entidade logada cadastrou/gerencia
// diretamente; "Geral" = todos. GET /associados só existe pra
// superadmin/agency_admin, e GET /agencias/:id/associados (Unidade) só pra
// superadmin/agency_admin/gerente (agency_operator NÃO) — só chamado quando
// faz sentido, evita 403 em loop. Um Associado comum (não gerente) não
// gerencia sub-associados — card fica com os dois campos zerados pra esse
// caso, de propósito.
const AssociadoCard_Dashboard = () => {
  const podeVerGeral = podeListarTodosAssociados();
  const podeVerUnidade = state.user?.role === 'agency_admin' || isGerente();

  const { data: geralResp } = useQueryAssociados(podeVerGeral);
  const { data: meusResp } = useQueryMeusAssociados(podeVerUnidade);

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
