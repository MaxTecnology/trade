import state from "@/store";
import StarRating from "@/components/Stars/StarRating";
import { useSnapshot } from "valtio";
import { useQueryReceberAgencia } from "@/hooks/ReactQuery/useQueryReceberAgencia";
import { useQueryReceberAssociado } from "@/hooks/ReactQuery/useQueryReceberAssociado";
import { getType, isAssociado, isMatriz, podeListarTodosAssociados } from "@/hooks/getId";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";
import { useQueryPagarGerentes } from "@/hooks/ReactQuery/dashboard/useQueryPagarGerentes";
import { useQueryProximaFatura } from "@/hooks/ReactQuery/dashboard/useQueryProximaFatura";
import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";

const ResumoFinanceiro = () => {
  const snap = useSnapshot(state);
  const { data: planos } = useQueryPlanos();
  // GET /cobrancas/minhas só existe pra associado/agência (Matriz não tem
  // "minhas cobranças"); GET /relatorios/comissoes-gerentes só pra
  // superadmin/agency_admin — evita 403 em loop pra quem não tem acesso.
  const { data: receberAgencia } = useQueryReceberAgencia(!isMatriz());
  const { data: receberAssociados } = useQueryReceberAssociado(!isMatriz());
  const { data: pagarGerentes } = useQueryPagarGerentes(podeListarTodosAssociados());
  const { data: proximaFatura } = useQueryProximaFatura(!isMatriz());

  const type = getType();
  var taxa = 0;
  if (snap.user && snap.user.conta && planos && planos.planos) {
    const matchingPlano = planos.planos.find(
      (plano) => plano.id === snap.user.conta.planoId
    );
    if (matchingPlano) {
      taxa = matchingPlano.taxaManutencaoAnual;
    }
  }
  return (
    <div className="homeBodyRightItem">
      <h5>Resumo Adiministrativo</h5>
      <div>
        {isAssociado() ? (
          <div>
            Score de Atendimento: <StarRating rating={snap.reputacao} />
          </div>
        ) : null}
        {type === "Associado - faill" ? (
          <div>
            Taxa de manutenção anual: <span>R$ {taxa}</span>
          </div>
        ) : null}
        {!isAssociado() ? (
          <div>
            A Receber Associados:
            <span>
              {receberAssociados && receberAssociados.valorTotalReceber ? (
                <>
                  RT${" "}
                  {formatarNumeroParaRT(receberAssociados?.valorTotalReceber)}
                </>
              ) : (
                " RT$ 0,00"
              )}
            </span>
          </div>
        ) : null}

        {type === "Associado - faill" ? (
          <div>
            A Pagar Agência:
            <span>
              {receberAssociados && receberAssociados.valorTotalReceber ? (
                <>
                  RT${" "}
                  {formatarNumeroParaRT(receberAssociados?.valorTotalReceber)}
                </>
              ) : (
                " RT$ 0,00"
              )}
            </span>
          </div>
        ) : null}

        {!isAssociado() && (
          <div>
            A Pagar Gerentes:
            <span>
              {pagarGerentes && pagarGerentes.valorTotalReceber
                ? pagarGerentes.valorTotalReceber
                : " RT$ 0,00"}
            </span>
          </div>
        )}

        {type === "Franquia Comum" ? (
          <div>
            A Pagar Matriz:
            <span>
              {receberAgencia &&
              receberAgencia?.aReceberRepasses?.valorTotalReceberMatriz
                ? receberAgencia?.aReceberCobrancas?.valorTotalCobrancas
                : " RT$ 0,00"}
            </span>
          </div>
        ) : null}

        {type === "Franquia Master" ? (
          <div>
            A Pagar Matriz:
            <span>
              {receberAgencia &&
              receberAgencia?.aReceberRepasses?.valorTotalReceberMatriz
                ? receberAgencia?.aReceberCobrancas?.valorTotalCobrancas
                : " RT$ 0,00"}
            </span>
          </div>
        ) : null}

        {isMatriz() ? (
          <div>
            A Receber Agência:
            <span>
              {receberAgencia && receberAgencia.aReceberRepasses ? (
                <>
                  RT${" "}
                  {formatarNumeroParaRT(
                    receberAgencia.aReceberRepasses.valorTotalReceberMatriz +
                      receberAgencia.aReceberCobrancas.valorTotalCobrancas
                  )}
                </>
              ) : (
                " RT$ 0,00"
              )}
            </span>
          </div>
        ) : null}
        {!isMatriz() ? (
          <div>
            Próxima fatura:{" "}
            <span>
              {proximaFatura && proximaFatura.proximaFatura
                ? formatDate(proximaFatura.proximaFatura)
                : "Sem fatura pendente"}
            </span>
          </div>
        ) : null}
        {isAssociado() && (
          <div>
            Data para Pagamento:
            <span>Não há cobranças</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumoFinanceiro;
