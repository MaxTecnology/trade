import state from "@/store";
import StarRating from "@/components/Stars/StarRating";
import { useSnapshot } from "valtio";
import { useQueryReceberAgencia } from "@/hooks/ReactQuery/useQueryReceberAgencia";
import { useQueryReceberAssociado } from "@/hooks/ReactQuery/useQueryReceberAssociado";
import { getType } from "@/hooks/getId";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";
import { useQueryPagarGerentes } from "@/hooks/ReactQuery/dashboard/useQueryPagarGerentes";
import { useQueryProximaFatura } from "@/hooks/ReactQuery/dashboard/useQueryProximaFatura";
import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";

const ResumoFinanceiro = () => {
  const snap = useSnapshot(state);
  const { data: planos } = useQueryPlanos();
  const { data: receberAgencia } = useQueryReceberAgencia();
  const { data: receberAssociados } = useQueryReceberAssociado();
  const { data: pagarGerentes } = useQueryPagarGerentes();
  const { data: proximaFatura } = useQueryProximaFatura();

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
        {type === "Associado" ? (
          <div>
            Score de Atendimento: <StarRating rating={snap.reputacao} />
          </div>
        ) : null}
        {type === "Associado - faill" ? (
          <div>
            Taxa de manutenção anual: <span>R$ {taxa}</span>
          </div>
        ) : null}
        {type !== "Associado" ? (
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

        {type !== "Associado" && (
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

        {type === "Matriz" ? (
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
        {type !== "Matriz" ? (
          <div>
            Próxima fatura:{" "}
            <span>
              {proximaFatura && proximaFatura.proximaFatura
                ? formatDate(proximaFatura.proximaFatura)
                : "Sem fatura pendente"}
            </span>
          </div>
        ) : null}
        {type === "Associado" && (
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
