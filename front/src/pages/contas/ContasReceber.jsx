import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import { activePage } from "../../utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import ContasTable from "@/components/Tables/ContasTable";
import { columns } from "./constantsContas";
import ContasSearch from "@/components/Search/ContasSearch";
import { useQueryContasReceber } from "@/hooks/ReactQuery/contas/useQueryContasReceber";
import ContasModal from "@/Modals/ContasModal";

const ContasReceber = () => {
    const { data } = useQueryContasReceber();
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
            <ContasSearch />
            <div className="containerList">
                <ContasTable
                    columns={columns}
                    data={data ? data : []}
                    modaltoggle={modalToggle}
                    setInfo={setInfo}
                />
            </div>
            <Footer />
        </div>)
};

export default ContasReceber;
