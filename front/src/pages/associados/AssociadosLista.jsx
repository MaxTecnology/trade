import { useEffect, useState } from "react";
import EditarAssociadoModal from '@/Modals/EditarAssociadoModal';
import SearchField from "@/components/Search/SearchField";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import AssociadosTable from "@/components/Tables/AssociadosTable";
import { columns } from "./constants";
import { useQueryAssociados } from "@/hooks/ReactQuery/useQueryAssociados";
import useModal from "@/hooks/useModal";
import { getType } from "@/hooks/getId";

const AssociadosLista = () => {
    const { data } = useQueryAssociados();
    const [modalIsOpen, modalToggle] = useModal(false);
    const [userInfo, setUserInfo] = useState()
    const [userId, setUserId] = useState()

    useEffect(() => {
        activePage("associados")
    }, []);

    return (
        <div className="container">
            {modalIsOpen ?
                <EditarAssociadoModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    associadoInfo={userInfo}
                    id={userId}
                />
                : null}
            <div className="containerHeader">Lista de Associados</div>
            <SearchField />
            <div className="containerList">
                <AssociadosTable
                    columns={columns}
                    data={data && data.data ? data.data : []}
                    setId={setUserId}
                    setInfo={setUserInfo}
                    modaltoggle={modalToggle}
                    type={getType()}
                />
            </div>
            <Footer />
        </div>)
};

export default AssociadosLista;
