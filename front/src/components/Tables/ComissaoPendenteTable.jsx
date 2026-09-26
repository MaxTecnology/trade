import { useSnapshot } from "valtio";
import filters from "@/store/filters";
import { formatarNumeroParaReal } from "@/utils/functions/formartNumber";
import { formatDate } from "@/hooks/ListasHook";

// Próximo dia 1 — quando o job mensal (commission.consolidate) vai fechar
// essa prévia numa fatura de verdade. Só um rótulo informativo, não precisa
// da mesma precisão de fuso horário das datas de vencimento reais.
const proximoFechamento = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    return formatDate(d);
};

// Lista provisória (ComissaoPlataforma/ComissaoGerente ainda não consolidada
// numa Cobranca/PagamentoGerente) — decisão de produto 2026-09-25, pra tela
// "Comissões" não ficar vazia entre um fechamento mensal e o outro. Cresce
// todo mês, então respeita filtro de "Pesquisar" (+ "Associado" ou "Gerente",
// conforme `namespace`) — a linha não é resultado de nenhuma tabela
// react-table própria, então o filtro é aplicado manualmente aqui.
//
// `namespace`: "table" (comissão da plataforma, ContasSearch) ou "gerente"
// (GerenteSearch) — dois filtros independentes na MESMA tela, cada um no seu
// namespace do store global pra não colidir (ver store/filters.js).
const ComissaoPendenteTable = ({ data, colunaNome, namespace = "table" }) => {
    const snapTable = useSnapshot(filters.table);
    const snapGerente = useSnapshot(filters.gerente);
    const snap = namespace === "gerente" ? snapGerente : snapTable;
    const busca = (snap.search ?? '').toLowerCase();
    const entidadeFiltro = namespace === "gerente" ? snap['gerente-filtro'] : snap['associado-filtro'];
    const dataFiltrada = (data ?? []).filter((item) => {
        if (busca && !item.nome?.toLowerCase().includes(busca)) return false;
        if (!entidadeFiltro) return true;
        if (namespace === "gerente") return item.gerenteId === entidadeFiltro;
        return [item.associadoId, item.agenciaId].filter(Boolean).includes(entidadeFiltro);
    });

    if (dataFiltrada.length === 0) {
        return <p className="text-gray-500">Nenhuma comissão em aberto no mês corrente.</p>;
    }
    return (
        <div className="w-full">
            <table className="w-full border-separate border-spacing-y-1">
                <thead>
                    <tr className="text-left">
                        <th>{colunaNome}</th>
                        <th>Valor acumulado</th>
                        <th>Situação</th>
                    </tr>
                </thead>
                <tbody>
                    {dataFiltrada.map((item) => (
                        <tr key={item.contaId ?? item.gerenteId}>
                            <td>{item.nome}</td>
                            <td>R$ {formatarNumeroParaReal(Number(item.valorBRL ?? 0))}</td>
                            <td className="text-amber-600">Provisório — fecha em {proximoFechamento()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ComissaoPendenteTable;
