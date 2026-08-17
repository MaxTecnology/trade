import { useEffect, useState } from "react";
import EditarGerenteModal from '@/Modals/EditarGerenteModal';
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import GerentesTable from "@/components/Tables/GerentesTable";
import { columns } from "./constants";
import useModal from "@/hooks/useModal";
import { useQueryGerentes } from "@/hooks/ReactQuery/useQueryGerentes";
import GerenteSearch from "@/components/Search/GerenteSearch";

const GerentesLista = () => {
    const { data } = useQueryGerentes()
    const [modalIsOpen, modalToggle] = useModal();
    const [userInfo, setUserInfo] = useState()
    const [userId, setUserId] = useState()

    useEffect(() => {
        activePage("gerentes")
    }, []);

    return (
        <div className="container">
            {modalIsOpen ?
                <EditarGerenteModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    associadoInfo={userInfo}
                    id={userId}
                />
                : null}
            <div className="containerHeader">Gerentes</div>
            <GerenteSearch />
            <div className="containerList">
                <GerentesTable
                    columns={columns}
                    data={data ?? []}
                    setId={setUserId}
                    setInfo={setUserInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default GerentesLista;
