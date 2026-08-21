import { useEffect, useState } from "react";
import SearchField from "@/components/Search/SearchField";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import AssociadosTable from "@/components/Tables/AssociadosTable";
import { columns } from "./constants";
import EditarUsuariosModal from "@/Modals/EditarUsuariosModal";
import useModal from "@/hooks/useModal";
import { useQueryUsuarios } from "@/hooks/ReactQuery/useQueryUsuarios";

// GET /usuarios já é auto-escopado no backend (Associado vê só os próprios
// operadores, Agência só os da própria agência) — não existe "ver todo
// mundo" nem pra Matriz (que nem tem acesso a essa rota).
const UsuariosLista = () => {
    const { data } = useQueryUsuarios()
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
                    associadoInfo={userInfo}
                    id={userId}
                />
                : null}
            <div className="containerHeader">Lista de Usuários</div>
            <SearchField />
            <div className="containerList">
                <AssociadosTable
                    columns={columns}
                    data={data?.data ?? []}
                    setId={setUserId}
                    setInfo={setUserInfo}
                    modaltoggle={modalToggle}
                    usuario
                />
            </div>
            <Footer />
        </div>)
};

export default UsuariosLista;
