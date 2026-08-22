import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import { activePage } from "../../utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import ContasTable from "@/components/Tables/ContasTable";
import { columns } from "./constantsContas";
import { useQueryContasPagar } from "@/hooks/ReactQuery/contas/useQueryContasPagar";
import ContasSearch from "@/components/Search/ContasSearch";
import ContasModal from "@/Modals/ContasModal";
import { exportContasPdf } from "@/utils/functions/exportContasPdf";

const ContasPagar = () => {
    const { data, refetch } = useQueryContasPagar();
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
            <div className="containerHeader">Contas a pagar</div>
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
