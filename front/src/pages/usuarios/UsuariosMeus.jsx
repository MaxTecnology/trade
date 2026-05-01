import { useEffect, useState } from "react";
import SearchField from "@/components/Search/SearchField";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import AssociadosTable from "@/components/Tables/AssociadosTable";
import { columns } from "./constants";
import EditarUsuariosModal from "@/Modals/EditarUsuariosModal";
import useModal from "@/hooks/useModal";
import { useQuerySubContas } from "@/hooks/ReactQuery/usuario/useQuerySubContas";

const UsuariosMeus = () => {
    const { data } = useQuerySubContas()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [userInfo, setUserInfo] = useState()
    const [userId, setUserId] = useState()

    useEffect(() => {
        activePage("usuarios")
    }, []);

    return (
        <div className="container">
            {modalIsOpen ?
                <EditarUsuariosModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    associadoInfo={userInfo} // Substitua associadoData pelo seu objeto associado
                    id={userId} // Substitua associadoId pelo ID do associado
                />
                : null}
            <div className="containerHeader">Lista de Sub Contas</div>
            <SearchField />
            <div className="containerList">
                <AssociadosTable
                    columns={columns}
                    data={data && data.subcontas ? data.subcontas : []}
                    setId={setUserId}
                    setInfo={setUserInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default UsuariosMeus;
