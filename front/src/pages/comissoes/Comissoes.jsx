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

// Comissão da plataforma, consolidada mensalmente pelo job commission.consolidate
// (ver docs/tech-debt.md) — reaproveita a mesma tabela/busca/modal de Cobranca
// já usada em "Contas a Pagar", só filtrando tipo=comissao.
const Comissoes = () => {
    const { data, refetch } = useQueryComissoes();
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
            <div className="containerList">
                <ContasTable
                    columns={columns}
                    data={data?.data ?? []}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    revalidate={refetch}
                />
            </div>
            <Footer />
        </div>)
};

export default Comissoes;
