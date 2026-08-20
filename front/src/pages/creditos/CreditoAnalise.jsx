import { useEffect, useState } from "react";
import Footer from '@/components/Footer';
import CreditosModal from "@/Modals/CreditosModal";
import SearchfieldCredito from "@/components/Search/SearchfieldCredito";
import { activePage } from "@/utils/functions/setActivePage";
import CreditosTable from "@/components/Tables/CreditosTable";
import { columns } from "./constantCreditos";
import useModal from "@/hooks/useModal";
import { useQueryCreditosAnalisar } from "@/hooks/ReactQuery/useQueryCreditosAnalisar";

const CreditoAnalise = () => {
    const { data, refetch } = useQueryCreditosAnalisar()
    const [id, setId] = useState("");
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState()

    useEffect(() => {
        activePage("creditos")
    }, []);

    return (
        <div className="container">
            {modalIsOpen ?
                <CreditosModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info}
                    setState={refetch}
                />
                : null}
            <div className="containerHeader">Creditos a Aprovar</div>
            <SearchfieldCredito />
            <div className="containerList">
                <CreditosTable
                    columns={columns}
                    data={data?.data ?? []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default CreditoAnalise;
