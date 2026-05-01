import { useEffect, useState } from "react";
import TransaçõesModal from "../../Modals/TransaçõesModal";
import Footer from "../../components/Footer";
import { activePage } from "../../utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import ContasTable from "@/components/Tables/ContasTable";
import { columns } from "./constantsContas";
import { useQueryCobranças } from "@/hooks/ReactQuery/useQueryCobranças";
import ContasSearch from "@/components/Search/ContasSearch";

const ContasPagar = () => {
    const { data } = useQueryCobranças();
    const [modalIsOpen, modalToggle] = useModal(false);
    const [reload, setReload] = useState(false)
    const [info, setInfo] = useState()

    useEffect(() => {
        activePage("contas")
    }, []);

    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info} // Substitua associadoData pelo seu objeto associado
                    setState={setReload}
                />
                : null}
            <div className="containerHeader">Contas a pagar</div>
            <ContasSearch />
            <div className="containerList">
                <ContasTable
                    columns={columns}
                    data={data ? data : []}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    setState={setReload}
                />
            </div>
            <Footer />
        </div>)
};

export default ContasPagar;
