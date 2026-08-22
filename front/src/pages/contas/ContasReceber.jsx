import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import { activePage } from "../../utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import ContasTable from "@/components/Tables/ContasTable";
import { columns } from "./constantsContas";
import ContasSearch from "@/components/Search/ContasSearch";
import { useQueryContasReceber } from "@/hooks/ReactQuery/contas/useQueryContasReceber";
import { useQueryContasReceberMatriz } from "@/hooks/ReactQuery/useQueryContasReceberMatriz";
import ContasModal from "@/Modals/ContasModal";
import { isMatriz } from "@/hooks/getId";
import { exportContasPdf } from "@/utils/functions/exportContasPdf";

const ContasReceber = () => {
    // Matriz vê tudo (GET /cobrancas) — ela não é "dona" de uma conta com
    // recebíveis no mesmo sentido que uma Agência; Agência vê só o que é
    // dela + dos seus associados (GET /cobrancas/minhas, direção padrão).
    const receberMatriz = useQueryContasReceberMatriz(isMatriz());
    const receberAgencia = useQueryContasReceber(!isMatriz());
    const { data, refetch } = isMatriz() ? receberMatriz : receberAgencia;

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
            <div className="containerHeader">Contas a Receber</div>
            <ContasSearch onGerarPdf={() => exportContasPdf(data?.data ?? [], "Contas a Receber")} />
            <div className="containerList">
                <ContasTable
                    columns={columns}
                    data={data?.data ?? []}
                    modaltoggle={modalToggle}
                    setInfo={setInfo}
                    revalidate={refetch}
                />
            </div>
            <Footer />
        </div>)
};

export default ContasReceber;
