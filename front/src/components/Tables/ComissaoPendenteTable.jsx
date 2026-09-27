import { useMemo } from "react";
import { useSnapshot } from "valtio";
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import filters from "@/store/filters";
import { formatarNumeroParaReal } from "@/utils/functions/formartNumber";
import { formatDate } from "@/hooks/ListasHook";
import PaginationTable from "./PaginationTable";

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
    // Memoizado por referência de `data`/filtros — mesmo motivo do `columns`
    // logo abaixo: um array novo a cada render (mesmo com conteúdo igual)
    // engana o react-table achando que os DADOS mudaram, disparando reset de
    // página à toa em qualquer re-render (ex: causado pelo próprio clique de
    // paginar).
    const dataFiltrada = useMemo(
        () =>
            (data ?? []).filter((item) => {
                if (busca && !item.nome?.toLowerCase().includes(busca)) return false;
                if (!entidadeFiltro) return true;
                if (namespace === "gerente") return item.gerenteId === entidadeFiltro;
                return [item.associadoId, item.agenciaId].filter(Boolean).includes(entidadeFiltro);
            }),
        [data, busca, entidadeFiltro, namespace]
    )

    // `columns` precisa ficar memoizado (useMemo) — passar um array literal
    // novo a cada render pro useReactTable é um anti-padrão conhecido do
    // react-table: ele reseta a página pra 0 toda vez que `columns` muda de
    // referência, e como aqui recriava um array novo em TODO render, virava
    // um loop de reset que travava a aba ao clicar em qualquer página
    // (achado ao validar a correção do "Mês corrente", 2026-09-26). Os
    // outros lugares que usam essa mesma tática (`colunasDetalhe` nos
    // modais de detalhe) já declaram as colunas fora do componente — aqui
    // não dava, porque `colunaNome` varia por instância (Associado/Agência
    // vs Gerente).
    const columns = useMemo(
        () => [
            { id: "nome", accessorKey: "nome", header: colunaNome },
            {
                id: "valor",
                accessorFn: (item) => Number(item.valorBRL ?? 0),
                header: "Valor acumulado",
                cell: (info) => `R$ ${formatarNumeroParaReal(info.getValue())}`,
            },
            {
                id: "situacao",
                header: "Situação",
                cell: () => <span className="text-amber-600">Provisório — fecha em {proximoFechamento()}</span>,
            },
        ],
        [colunaNome]
    )

    // Antes renderizava dataFiltrada inteira num .map() sem paginação — numa
    // conta com muitas empresas/gerentes com comissão pendente no ciclo,
    // virava uma lista enorme só com scroll (achado do usuário, 2026-09-26).
    const table = useReactTable({
        data: dataFiltrada,
        columns,
        getRowId: (item) => item.contaId ?? item.gerenteId,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    if (dataFiltrada.length === 0) {
        return <p className="text-gray-500">Nenhuma comissão em aberto no mês corrente.</p>;
    }
    return (
        <div className="w-full">
            <table className="w-full border-separate border-spacing-y-1">
                <thead>
                    <tr className="text-left">
                        {table.getHeaderGroups()[0].headers.map((header) => (
                            <th key={header.id}>{header.column.columnDef.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <PaginationTable table={table} />
        </div>
    );
};

export default ComissaoPendenteTable;
