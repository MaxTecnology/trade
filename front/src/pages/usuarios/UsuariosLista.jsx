import { useEffect, useState } from "react";
import SearchField from "@/components/Search/SearchField";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import AssociadosTable from "@/components/Tables/AssociadosTable";
import { columns } from "./constants";
import EditarUsuariosModal from "@/Modals/EditarUsuariosModal";
import useModal from "@/hooks/useModal";
import { useQueryUsuarios } from "@/hooks/ReactQuery/useQueryUsuarios";
import { useQueryMeusUsuarios } from "@/hooks/ReactQuery/usuario/useQueryMeusUsuarios";
import { getType } from "@/hooks/getId";

const UsuariosLista = () => {
    const { data } = useQueryUsuarios()
    const type = getType()
    const { data: myUsers } = useQueryMeusUsuarios()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [userInfo, setUserInfo] = useState()
    const [userId, setUserId] = useState()

    useEffect(() => {
        activePage("usuarios")
    }, []);
    console.log(type)
    console.log(myUsers)
    const tableData = type === "Matriz" ? data?.data : myUsers
    return (
        <div className="container">
            {modalIsOpen ?
                <EditarUsuariosModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    associadoInfo={userInfo}
                    id={userId}
                />
                : null}
            <div className="containerHeader">Lista de Usuários</div>
            <SearchField />
            <div className="containerList">
                <AssociadosTable
                    columns={columns}
                    data={tableData ? tableData : []}
                    setId={setUserId}
                    setInfo={setUserInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default UsuariosLista;
