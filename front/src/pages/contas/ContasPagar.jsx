import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import { activePage } from "../../utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import ContasTable from "@/components/Tables/ContasTable";
import { columns } from "./constantsContas";
import { useQueryContasPagar } from "@/hooks/ReactQuery/contas/useQueryContasPagar";
import { useQueryTodasCobrancas } from "@/hooks/ReactQuery/contas/useQueryTodasCobrancas";
import ContasSearch from "@/components/Search/ContasSearch";
import ContasModal from "@/Modals/ContasModal";
import { exportContasPdf } from "@/utils/functions/exportContasPdf";
import { isMatriz } from "@/hooks/getId";

const ContasPagar = () => {
    // Matriz nunca é devedora — pra ela essa tela vira a visão consolidada
    // do que os associados/agências têm pendente (ver useQueryTodasCobrancas.js).
    const matriz = isMatriz();
    const { data: dataPropria, refetch: refetchPropria } = useQueryContasPagar();
    const { data: dataTodas, refetch: refetchTodas } = useQueryTodasCobrancas();
    const data = matriz ? dataTodas : dataPropria;
    const refetch = matriz ? refetchTodas : refetchPropria;
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
            <div className="containerHeader">{matriz ? "Contas a pagar dos associados" : "Contas a pagar"}</div>
            <ContasSearch onGerarPdf={() => exportContasPdf(data?.data ?? [], "Contas a Pagar")} />
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

export default ContasPagar;
