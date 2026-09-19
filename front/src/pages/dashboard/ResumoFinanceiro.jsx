import state from "@/store";
import StarRating from "@/components/Stars/StarRating";
import { useSnapshot } from "valtio";
import { useQueryContasReceberMatriz } from "@/hooks/ReactQuery/useQueryContasReceberMatriz";
import { useQueryContasReceber } from "@/hooks/ReactQuery/contas/useQueryContasReceber";
import { getType, isAgencia, isAssociado, isMatriz, podeListarTodosAssociados } from "@/hooks/getId";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";
import { useQueryPagarGerentes } from "@/hooks/ReactQuery/dashboard/useQueryPagarGerentes";
import { useQueryProximaFatura } from "@/hooks/ReactQuery/dashboard/useQueryProximaFatura";
import { useQueryComissaoAcumulada } from "@/hooks/ReactQuery/dashboard/useQueryComissaoAcumulada";
import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT, formatarNumeroParaReal } from "@/utils/functions/formartNumber";

const ResumoFinanceiro = () => {
  const snap = useSnapshot(state);
  const { data: planos } = useQueryPlanos();
  // Mesma fonte de dados da tela "Contas a Receber" (useQueryContasReceberMatriz/
  // useQueryContasReceber) — dashboard e tela ficam sempre consistentes entre si,
  // sem endpoint duplicado. GET /relatorios/comissoes-gerentes só pra
  // superadmin/agency_admin — evita 403 em loop pra quem não tem acesso.
  const { data: receberMatrizResp } = useQueryContasReceberMatriz(isMatriz());
  const { data: receberAgenciaResp } = useQueryContasReceber(isAgencia());
  const { data: pagarGerentes } = useQueryPagarGerentes(podeListarTodosAssociados());
  const { data: proximaFatura } = useQueryProximaFatura(!isMatriz());
  // useQueryProximaFatura devolve o envelope de cobrancas/minhas?...&limit=1:
  // {success, data: [cobranca]} — não um objeto {proximaFatura}.
  const proximaCobranca = proximaFatura?.data?.[0];
  // "Próxima fatura" virou VALOR (decisão de produto 2026-09-19) — o que já
  // foi gerado de comissão no mês corrente, ainda não faturado, crescendo em
  // tempo real a cada transação. "Data para Pagamento" continua sendo a data
  // (proximaCobranca acima), sem mudança.
  const { data: comissaoAcumulada } = useQueryComissaoAcumulada(!isMatriz());
  const valorProximaFatura = Number(comissaoAcumulada?.data?.valorAcumulado ?? 0);

  // Subtotais calculados a partir da mesma lista de cobranças pendentes que
  // "Contas a Receber" já mostra — associadoId preenchido = dívida de
  // associado; só agenciaId (sem associadoId) = dívida da própria agência
  // (nunca dupla-conta, já que toda Cobranca de associado tem os dois campos).
  const cobrancasReceber = (isMatriz() ? receberMatrizResp : receberAgenciaResp)?.data ?? [];
  const pendentesReceber = cobrancasReceber.filter((c) => !c.pago);
  // Cobranca pode ser BRL OU RT (nunca as duas) — soma cada moeda separada,
  // igual "Contas a Receber" já faz linha a linha (constantsContas.js::valorCobranca).
  const somarPorMoeda = (lista) =>
    lista.reduce(
      (totais, c) => ({
        brl: totais.brl + Number(c.valorBRL ?? 0),
        rt: totais.rt + Number(c.valorRT ?? 0),
      }),
      { brl: 0, rt: 0 },
    );
  const totalReceberAssociados = somarPorMoeda(pendentesReceber.filter((c) => c.associadoId));
  const totalReceberAgencia = somarPorMoeda(pendentesReceber.filter((c) => !c.associadoId && c.agenciaId));

  // Comissão de gerente é sempre BRL (decisão de produto 2026-09-18) — soma só
  // os PagamentoGerente ainda não pagos, mesma fonte da seção "A Pagar
  // Gerentes" da tela "Comissões".
  const totalPagarGerentes = (pagarGerentes?.data ?? [])
    .filter((p) => !p.pago)
    .reduce((soma, p) => soma + Number(p.valorBRL ?? 0), 0);

  const formatarTotal = ({ brl, rt }) => {
    const partes = [];
    if (brl > 0) partes.push(`R$ ${formatarNumeroParaReal(brl)}`);
    if (rt > 0) partes.push(`RT$ ${formatarNumeroParaRT(rt)}`);
    return partes.length ? partes.join(" + ") : "R$ 0,00";
  };

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
            <span> {formatarTotal(totalReceberAssociados)}</span>
          </div>
        ) : null}

        {!isAssociado() && (
          <div>
            A Pagar Gerentes:
            <span> R$ {formatarNumeroParaReal(totalPagarGerentes)}</span>
          </div>
        )}

        {isMatriz() ? (
          <div>
            A Receber Agência:
            <span> {formatarTotal(totalReceberAgencia)}</span>
          </div>
        ) : null}
        {!isMatriz() ? (
          <div>
            Próxima fatura:{" "}
            <span>R$ {formatarNumeroParaReal(valorProximaFatura)}</span>
          </div>
        ) : null}
        {isAssociado() && (
          <div>
            Data para Pagamento:
            <span>
              {proximaCobranca
                ? formatDate(proximaCobranca.vencimento)
                : "Não há cobranças"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumoFinanceiro;
