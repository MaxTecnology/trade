import { useEffect, useState } from "react";
import Footer from '@/components/Footer';
import CreditosModal from "@/Modals/CreditosModal";
import SearchfieldCredito from "@/components/Search/SearchfieldCredito";
import { activePage } from "@/utils/functions/setActivePage";
import CreditosTable from "@/components/Tables/CreditosTable";
import { columns } from "./constantCreditos";
import useModal from "@/hooks/useModal";
import { useQueryCreditosMeus } from "@/hooks/ReactQuery/useQueryCreditosMeus";

const CreditoMeus = () => {
    const { data, refetch } = useQueryCreditosMeus()
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
            <div className="containerHeader">Meus Créditos</div>
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

export default CreditoMeus;
