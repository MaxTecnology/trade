import { useEffect, useState } from "react";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import Footer from "@/components/Footer";
import SearchfieldTrade from "@/components/Search/SearchfieldTrade";
import { activePage } from "@/utils/functions/setActivePage";
import TransacoesTable from "@/components/Tables/TransacoesTable";
import useModal from "@/hooks/useModal";
import { useQueryEncaminhadasExtorno } from "@/hooks/ReactQuery/estornos/useQueryEncaminhadasExtorno";
import { useQueryExtornoMatriz } from "@/hooks/ReactQuery/estornos/useQueryExtornoMatriz";
import { getType } from "@/hooks/getId";
import { columns } from "./extornoConstants";

const TransaçõesExtorno = () => {
    const { data: agencia } = useQueryEncaminhadasExtorno()
    const { data: matriz } = useQueryExtornoMatriz()
    const [modalIsOpen, modalToggle] = useModal();
    const type = getType()
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    const data = matriz && agencia && agencia["Solicitações de estorno"] ? [...agencia["Solicitações de estorno"], ...matriz.transacoes] : ["AAA"]

    const dataToDisplay = type === "Matriz" ? data : (agencia && agencia["Solicitações de estorno"]) || [];

    useEffect(() => {
        activePage("transações")
    }, []);
    console.log(agencia)
    console.log(matriz)
    console.log("THE DATA", data)
    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info} // Substitua associadoData pelo seu objeto associado
                />
                : null}
            <div className="containerHeader">Solicitações de Extorno</div>
            <SearchfieldTrade />
            <div className="containerList">
                <TransacoesTable
                    columns={columns}
                    data={dataToDisplay}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    agencia={type !== "Matriz" ? true : false}
                    matriz={type === "Matriz" ? true : false}
                />
            </div>
            <Footer />
        </div>)
};

export default TransaçõesExtorno;
