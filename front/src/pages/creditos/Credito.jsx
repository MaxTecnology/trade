import { useEffect, useState } from "react";
import Footer from '@/components/Footer';
import CreditosModal from "@/Modals/CreditosModal";
import SearchfieldCredito from "@/components/Search/SearchfieldCredito";
import { activePage } from "@/utils/functions/setActivePage";
import CreditosTable from "@/components/Tables/CreditosTable";
import { columns } from "./constantCreditos";
import { getApiData } from "@/hooks/ListasHook";
import useModal from "@/hooks/useModal";

const Credito = () => {
    const [data, setData] = useState([]);
    const [id, setId] = useState("");
    const [modalIsOpen, modalToggle] = useModal(false);
    const [reload, setReload] = useState(false)
    const [info, setInfo] = useState()
    useEffect(() => {
        activePage("creditos")
    }, []);

    useEffect(() => {
        getApiData("creditos/listar-todos", setData)
    }, [reload]);

    return (
        <div className="container">
            {modalIsOpen ?
                <CreditosModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info}
                    setState={setReload}
                    admin={true}
                />
                : null}
            <div className="containerHeader">Creditos</div>
            <SearchfieldCredito />
            <div className="containerList">
                <CreditosTable
                    columns={columns}
                    data={data && data.todasSolicitacoes ? data.todasSolicitacoes : []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    setState={setReload}
                />
            </div>
            <Footer />
        </div>)
};

export default Credito;
