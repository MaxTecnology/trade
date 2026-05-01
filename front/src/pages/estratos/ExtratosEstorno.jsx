import { useState } from "react";
import Footer from '@/components/Footer';
import ExtratosSearch from "@/components/Search/ExtratosSearch";
import useModal from "@/hooks/useModal";
import { columns } from "./constantsExtratos";
import ExtratosTable from "@/components/Tables/ExtratosTable";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import { getType } from "@/hooks/getId";
import { useQueryEncaminhadasExtorno } from "@/hooks/ReactQuery/estornos/useQueryEncaminhadasExtorno";
import { useQueryExtornoMatriz } from "@/hooks/ReactQuery/estornos/useQueryExtornoMatriz";

const ExtratosEstorno = () => {
    const { data: agencia } = useQueryEncaminhadasExtorno()
    const { data: matriz } = useQueryExtornoMatriz()
    console.log(agencia)
    console.log(matriz)
    const [modalIsOpen, modalToggle] = useModal();
    const type = getType()
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    const data = matriz && agencia && agencia["Solicitações de estorno"] ? [...agencia["Solicitações de estorno"], ...matriz.transacoes] : ["AAA"]
    const dataToDisplay = type === "Matriz" ? data : (agencia && agencia["Solicitações de estorno"]) || [];

    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info} // Substitua associadoData pelo seu objeto associado
                />
                : null}
            <div className="containerHeader">Estornos</div>
            <ExtratosSearch />
            <div className="containerList">
                <ExtratosTable
                    columns={columns}
                    data={dataToDisplay ? dataToDisplay : []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    type={getType()}
                />
            </div>
            <Footer />
        </div>)
};

export default ExtratosEstorno;
