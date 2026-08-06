import { useEffect, useState } from "react";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import Footer from "@/components/Footer";
import SearchfieldTrade from "@/components/Search/SearchfieldTrade";
import { activePage } from "@/utils/functions/setActivePage";
import TransacoesTable from "@/components/Tables/TransacoesTable";
import useModal from "@/hooks/useModal";
import { useQueryEncaminhadasExtorno } from "@/hooks/ReactQuery/estornos/useQueryEncaminhadasExtorno";
import { useQueryExtornoMatriz } from "@/hooks/ReactQuery/estornos/useQueryExtornoMatriz";
import state from "@/store";
import { useSnapshot } from "valtio";
import { columns } from "./extornoConstants";

const TransaçõesExtorno = () => {
    const snap = useSnapshot(state);
    const isMatriz = snap.user?.tipo === "superadmin";

    const { data: agencia } = useQueryEncaminhadasExtorno()
    const { data: matriz } = useQueryExtornoMatriz()
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({})
    const [id, setId] = useState()

    const dataToDisplay = isMatriz ? (matriz?.data ?? []) : (agencia?.data ?? []);

    useEffect(() => {
        activePage("transações")
    }, []);

    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info}
                />
                : null}
            <div className="containerHeader">Solicitações de Estorno</div>
            <SearchfieldTrade />
            <div className="containerList">
                <TransacoesTable
                    columns={columns}
                    data={dataToDisplay}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    agencia={!isMatriz}
                    matriz={isMatriz}
                />
            </div>
            <Footer />
        </div>)
};

export default TransaçõesExtorno;
