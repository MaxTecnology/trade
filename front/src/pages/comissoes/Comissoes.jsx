import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import ContasTable from "@/components/Tables/ContasTable";
import { columns } from "@/pages/contas/constantsContas";
import { useQueryComissoes } from "@/hooks/ReactQuery/contas/useQueryComissoes";
import ContasSearch from "@/components/Search/ContasSearch";
import ContasModal from "@/Modals/ContasModal";
import { exportContasPdf } from "@/utils/functions/exportContasPdf";
import PagamentoGerenteTable from "@/components/Tables/PagamentoGerenteTable";
import { useQueryPagarGerentes } from "@/hooks/ReactQuery/dashboard/useQueryPagarGerentes";
import ComissaoPendenteTable from "@/components/Tables/ComissaoPendenteTable";
import { useQueryComissaoPendente } from "@/hooks/ReactQuery/contas/useQueryComissaoPendente";
import { useQueryPagamentosGerentePendente } from "@/hooks/ReactQuery/contas/useQueryPagamentosGerentePendente";
import GerenteComissaoSearch from "@/components/Search/GerenteComissaoSearch";

// Duas direções distintas de comissão, sempre visíveis juntas nessa tela:
// o que a Matriz RECEBE (comissão da plataforma, Cobranca tipo=comissao,
// consolidada mensalmente pelo job commission.consolidate) e o que ela PAGA
// (comissão de gerente, PagamentoGerente, mesmo job) — ver docs/tech-debt.md.
// Cada uma ganha uma seção "ainda não fechada" ACIMA da tabela de faturas
// reais, lendo direto de ComissaoPlataforma/ComissaoGerente ainda soltas —
// sem isso a tela fica vazia o mês inteiro até o job rodar no dia 1
// (decisão de produto 2026-09-25).
const Comissoes = () => {
    const { data, refetch } = useQueryComissoes();
    const { data: pagamentosGerente, refetch: refetchGerentes } = useQueryPagarGerentes();
    const { data: comissaoPendente } = useQueryComissaoPendente();
    const { data: pagamentosGerentePendente } = useQueryPagamentosGerentePendente();
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState()

    useEffect(() => {
        activePage("contas")
    }, []);

    return (
        <div className="container">
            {modalIsOpen ?
                <ContasModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info}
                />
                : null}
            <div className="containerHeader">Comissões</div>
            <ContasSearch onGerarPdf={() => exportContasPdf(data?.data ?? [], "Comissões")} />
            <div className="containerHeader">Mês corrente (ainda não fechado)</div>
            <div className="containerList">
                <ComissaoPendenteTable data={comissaoPendente?.data ?? []} colunaNome="Associado/Agência" namespace="table" />
            </div>
            <div className="containerList">
                <ContasTable
                    columns={columns}
                    data={data?.data ?? []}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    revalidate={refetch}
                />
            </div>
            <div className="containerHeader">A Pagar Gerentes</div>
            <GerenteComissaoSearch />
            <div className="containerHeader">Mês corrente (ainda não fechado)</div>
            <div className="containerList">
                <ComissaoPendenteTable data={pagamentosGerentePendente?.data ?? []} colunaNome="Gerente" namespace="gerente" />
            </div>
            <div className="containerList">
                <PagamentoGerenteTable
                    data={pagamentosGerente?.data ?? []}
                    revalidate={refetchGerentes}
                />
            </div>
            <Footer />
        </div>)
};

export default Comissoes;
