import { useState } from "react";
import Footer from '@/components/Footer';
import ExtratosSearch from "@/components/Search/ExtratosSearch";
import useModal from "@/hooks/useModal";
import { useQueryTransacoes } from "@/hooks/ReactQuery/useQueryTransacoes";
import { columns } from "./constantsExtratos";
import ExtratosTable from "@/components/Tables/ExtratosTable";
import TransaçõesModal from "@/Modals/TransaçõesModal";

const Extratos = () => {
    const { data } = useQueryTransacoes()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info} // Substitua associadoData pelo seu objeto associado
                />
                : null}
            <div className="containerHeader">Extratos</div>
            <ExtratosSearch />
            <div className="containerList">
                <ExtratosTable
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

export default Extratos;
