import { useState } from "react";
import Footer from '@/components/Footer';
import useModal from "@/hooks/useModal";
import { columns } from "./constantsMeuExtrato";
import ExtratosSearch from "@/components/Search/ExtratosSearch";
import ExtratosTable from "@/components/Tables/ExtratosTable";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import { useQueryExtrato } from "@/hooks/ReactQuery/useQueryExtrato";
import filters from "@/store/filters";
import { applyMeuExtratoFilters } from "@/utils/functions/meuExtratoFilters";
import { exportMeuExtratoPdf } from "@/utils/functions/exportMeuExtratoPdf";

const MeusExtratos = () => {
    const { data } = useQueryExtrato()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState({})
    const [id, setId] = useState()

    const handleGerarPdf = () => {
        exportMeuExtratoPdf(applyMeuExtratoFilters(data?.data ?? [], filters.table))
    }

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
            <ExtratosSearch onGerarPdf={handleGerarPdf} />
            <div className="containerList">
                <ExtratosTable
                    columns={columns}
                    data={data?.data ?? []}
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
