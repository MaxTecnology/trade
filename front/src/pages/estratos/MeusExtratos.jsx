import { useState } from "react";
import EditarAgenciaModal from '@/Modals/EditarAgenciaModal';
import Footer from '@/components/Footer';
import { useSnapshot } from "valtio";
import state from "@/store";
import useModal from "@/hooks/useModal";
import { columns } from "./constantsExtratos";
import ExtratosSearch from "@/components/Search/ExtratosSearch";
import ExtratosTable from "@/components/Tables/ExtratosTable";
import TransaçõesModal from "@/Modals/TransaçõesModal";

const MeusExtratos = () => {
    const snap = useSnapshot(state);
    const data = snap.user.transacoesComprador.concat(snap.user.transacoesVendedor)
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
            <div className="containerHeader">Meus extratos</div>
            <ExtratosSearch />
            <div className="containerList">
                <ExtratosTable
                    columns={columns}
                    data={data ? data : []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    myTable
                />
            </div>
            <Footer />
        </div>)
};

export default MeusExtratos;
