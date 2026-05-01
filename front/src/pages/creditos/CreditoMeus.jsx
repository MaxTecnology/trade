import { useEffect, useState } from "react";
import Footer from '@/components/Footer';
import CreditosModal from "@/Modals/CreditosModal";
import SearchfieldCredito from "@/components/Search/SearchfieldCredito";
import { activePage } from "@/utils/functions/setActivePage";
import CreditosTable from "@/components/Tables/CreditosTable";
import { columns } from "./constantCreditos";
import { getApiData } from "@/hooks/ListasHook";
import { getId } from "@/hooks/getId";

const CreditoMeus = () => {
    const [data, setData] = useState([]);
    const [id, setId] = useState("");
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [reload, setReload] = useState(false)
    const [info, setInfo] = useState()

    useEffect(() => {
        activePage("creditos")
    }, []);
    const modalToggle = () => {
        setModalIsOpen(!modalIsOpen);
    };

    useEffect(() => {
        getApiData("creditos/listar/" + getId(), setData)
    }, [reload]);

    return (
        <div className="container">
            {modalIsOpen ?
                <CreditosModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info} // Substitua associadoData pelo seu objeto associado
                    setState={setReload}
                    admin={true}
                />
                : null}
            <div className="containerHeader">Meus Créditos</div>
            <SearchfieldCredito />
            <div className="containerList">
                {data && data.solicitacoesCredito ?
                    <CreditosTable
                        columns={columns}
                        data={data.solicitacoesCredito}
                        setId={setId}
                        setInfo={setInfo}
                        modaltoggle={modalToggle}
                        setState={setReload}
                    />
                    :
                    <CreditosTable
                        columns={columns}
                        data={data}
                        setId={setId}
                        setInfo={setInfo}
                        modaltoggle={modalToggle}
                        setState={setReload}
                    />
                }
            </div>
            <Footer />
        </div>)
};

export default CreditoMeus;
