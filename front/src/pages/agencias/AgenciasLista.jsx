import { useEffect, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import EditarAgenciaModal from '@/Modals/EditarAgenciaModal';
import Footer from '@/components/Footer';
import SearchInput from '@/components/Search/SearchInput';
import { useNavigate } from 'react-router-dom';
import { activePage } from "@/utils/functions/setActivePage";
import AgenciasTable from "@/components/Tables/AgenciasTable";
import { columns } from "./constants";
import useModal from "@/hooks/useModal";
import { useQueryAgencias } from "@/hooks/ReactQuery/useQueryAgencias";
import filters from "@/store/filters";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import { getType } from "@/hooks/getId";

const AgenciasLista = () => {
    const { data } = useQueryAgencias()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [userInfo, setUserInfo] = useState()
    const [userId, setUserId] = useState()

    useEffect(() => {
        activePage("agencias")
    }, []);

    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/agenciasCadastrar")
    }
    const handleSearch = (e) => {
        filters.table[e.target.name] = e.target.value
        console.log(filters)
    }

    return (
        <div className="container">
            {modalIsOpen ?
                <EditarAgenciaModal
                    isOpen={modalIsOpen}
                    modalToggle={modalToggle}
                    associadoInfo={userInfo}
                    id={userId}
                />
                : null}
            <div className="containerHeader">Agencias</div>
            <form className="containerSearch">
                <div className="searchRow">
                    <SearchInput />
                    <div className="form-group">
                        <label htmlFor="porcentagem">Tipo</label>
                        <select className="form-control" name="tipo" onChange={handleSearch}>
                            <option value="">Selecionar</option>
                            <option value="Comum">Associado</option>
                            <option value="Master">Master</option>
                            <option value="Filial">Filial</option>
                            <option value="Matriz">Matriz</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="nomePlano">Nome Fantasia</label>
                        <input type="text" id="nomePlano" name="nomeFranquia" placeholder="Digite o nome fantasia" onChange={handleSearch} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nomePlano">N° da Conta</label>
                        <input type="number" id="nomePlano" name="conta" placeholder="Digite o N° da Conta" onChange={handleSearch} />
                    </div>
                    <div className="buttonContainer">
                        <ButtonMotion type="submit"><FaSearch />  Pesquisar</ButtonMotion>
                        <ButtonMotion onClick={handleclick} className="purpleBtn" type="button"><FaPlus /> Nova Agência</ButtonMotion>
                    </div>
                </div>
            </form>
            <div className="containerList">
                <AgenciasTable
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

export default AgenciasLista;
