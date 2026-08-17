import { useState } from "react";
import Footer from '@/components/Footer';
import ExtratosSearch from "@/components/Search/ExtratosSearch";
import useModal from "@/hooks/useModal";
import { columns } from "./constantsExtratos";
import ExtratosTable from "@/components/Tables/ExtratosTable";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import { isMatriz, isAgencia } from "@/hooks/getId";
import { useQueryEncaminhadasExtorno } from "@/hooks/ReactQuery/estornos/useQueryEncaminhadasExtorno";
import { useQueryExtornoMatriz } from "@/hooks/ReactQuery/estornos/useQueryExtornoMatriz";

const ExtratosEstorno = () => {
    const { data: agencia } = useQueryEncaminhadasExtorno()
    const { data: matriz } = useQueryExtornoMatriz()
    const [modalIsOpen, modalToggle] = useModal();
    // ExtratosTable espera "Matriz"/"Agência" literal — mantém o contrato de
    // prop que o componente já usa, só resolve o valor certo pra passar.
    const tipoConta = isMatriz() ? "Matriz" : isAgencia() ? "Agência" : "Associado"
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    const data = matriz && agencia && agencia["Solicitações de estorno"] ? [...agencia["Solicitações de estorno"], ...matriz.transacoes] : ["AAA"]
    const dataToDisplay = isMatriz() ? data : (agencia && agencia["Solicitações de estorno"]) || [];

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
                    type={tipoConta}
                />
            </div>
            <Footer />
        </div>)
};

export default ExtratosEstorno;
