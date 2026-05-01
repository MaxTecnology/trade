import { useEffect, useState } from "react";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import Footer from "@/components/Footer";
import SearchfieldTrade from "@/components/Search/SearchfieldTrade";
import { activePage } from "@/utils/functions/setActivePage";
import TransacoesTable from "@/components/Tables/TransacoesTable";
import { columns } from "./constants";
import { useQueryTransacoes } from "@/hooks/ReactQuery/useQueryTransacoes";
import useModal from "@/hooks/useModal";

const Transações = () => {
    const { data } = useQueryTransacoes()
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({})
    const [id, setId] = useState()

    useEffect(() => {
        activePage("transações")
    }, []);

    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info} // Substitua associadoData pelo seu objeto associado
                />
                : null}
            <div className="containerHeader">Transações</div>
            <SearchfieldTrade />
            <div className="containerList">
                <TransacoesTable
                    columns={columns}
                    data={data && data.transacoes ? data.transacoes : []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default Transações;
