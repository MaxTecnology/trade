import { FaPlus, FaSearch } from "react-icons/fa";
import SearchInput from "./SearchInput";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import filters from "@/store/filters";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const GerenteSearch = () => {
    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/gerentesCadastrar")
    }
    useEffect(() => {
        filters.table = {}
    }, [])

    const handleSearch = (e) => {
        filters.table[e.target.name] = e.target.value
    }

    return (
        <form className="containerSearch">
            <div className="searchRow">
                <SearchInput />
                <div className="form-group">
                    <label htmlFor="nome">Nome</label>
                    <input type="text" id="nome" name="nome" placeholder="Nome do gerente" onChange={handleSearch} />
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit"><FaSearch /> Pesquisar</ButtonMotion>
                    <ButtonMotion onClick={handleclick} className="purpleBtn" type="button"><FaPlus /> Cadastrar</ButtonMotion>
                </div>
            </div>

        </form>
    )
};

export default GerenteSearch;
