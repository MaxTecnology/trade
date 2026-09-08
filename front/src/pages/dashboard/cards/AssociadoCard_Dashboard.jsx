import { useQueryAssociados } from "@/hooks/ReactQuery/useQueryAssociados";
import { useQueryMeusAssociados } from "@/hooks/ReactQuery/useQueryMeusAssociados";
import { useQueryAssociadosDiretorio } from "@/hooks/ReactQuery/useQueryAssociadosDiretorio";
import { isMatriz, isAssociado, isGerente, podeListarTodosAssociados } from "@/hooks/getId";
import { motion } from "framer-motion";
import state from "@/store";

// "Unidade" = associados que a própria entidade logada cadastrou/gerencia
// diretamente; "Geral" = todos. GET /associados só existe pra
// superadmin/agency_admin, e GET /agencias/:id/associados (Unidade) só pra
// superadmin/agency_admin/gerente (agency_operator NÃO) — só chamado quando
// faz sentido, evita 403 em loop.
//
// Associado comum (não gerente) não tem acesso a essas rotas administrativas
// — usa /associados/diretorio (a mesma lista pública da tela Associados),
// que EXCLUI o próprio requisitante (correto pro seletor de parceiro de
// negociação, errado pra uma contagem) — soma +1 de volta pra compensar.
// Cadastrado direto pela Matriz (sem agenciaId) = Unidade e Geral iguais;
// vinculado a uma Agência = Unidade conta só os associados da mesma agência.
const AssociadoCard_Dashboard = () => {
  const podeVerGeral = podeListarTodosAssociados();
  const podeVerUnidade = state.user?.role === 'agency_admin' || isGerente();
  const ehAssociadoComum = isAssociado() && !isGerente();

  const { data: geralResp } = useQueryAssociados(podeVerGeral);
  const { data: meusResp } = useQueryMeusAssociados(podeVerUnidade);
  const { data: diretorioResp } = useQueryAssociadosDiretorio(ehAssociadoComum);

  let geral;
  let unidade;
  if (ehAssociadoComum) {
    const diretorio = diretorioResp?.data ?? [];
    const minhaAgenciaId = state.user?.agenciaId;
    geral = diretorio.length + 1;
    unidade = minhaAgenciaId
      ? diretorio.filter((a) => a.agenciaId === minhaAgenciaId).length + 1
      : geral;
  } else {
    const geralAdmin = geralResp?.data ?? [];
    geral = geralAdmin.length;
    unidade = isMatriz() ? geralAdmin.filter((a) => !a.agenciaId).length : (meusResp?.data ?? []).length;
  }

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
            <p>{unidade}</p>
          </div>
          <div>
            <p>Geral</p>
            <p>{geral}</p>
          </div>
        </div>
      </div>
      <div className="homeCardBar" />
    </motion.div>
  );
};

export default AssociadoCard_Dashboard;
