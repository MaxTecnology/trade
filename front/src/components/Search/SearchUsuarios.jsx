import { FaSearch, FaPlus } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import filters from '@/store/filters';
import SearchInput from '@/components/Search/SearchInput';
import ButtonMotion from '@/components/FramerMotion/ButtonMotion';
import { useEffect } from "react";
import { isAgencia } from "@/hooks/getId";

// Busca própria pra tela de Usuários (sub-contas) — antes reaproveitava
// SearchField.jsx (Agência/Categoria/Estado/Cidade, "+ Novo Associado"),
// que é o form de busca de Associados e não filtrava nada aqui.
const SearchUsuarios = () => {
    const navigate = useNavigate();
    const agencia = isAgencia();

    useEffect(() => {
        filters.table = {}
    }, [])

    const handleSearch = (e) => {
        filters.table[e.target.name] = e.target.value
    }

    return (
        <form action="" onSubmit={(e) => e.preventDefault()} className="containerSearch">
            <div className="searchRow">
                <SearchInput />
                <div className="form-group f2">
                    <label>Perfil</label>
                    <select defaultValue="" name="role" onChange={handleSearch}>
                        <option value="">Todos</option>
                        {agencia ? (
                            <>
                                <option value="agency_admin">Administrador de Agência</option>
                                <option value="agency_operator">Operador de Agência</option>
                            </>
                        ) : (
                            <>
                                <option value="associate_admin">Administrador Associado</option>
                                <option value="associate_operator">Operador Associado</option>
                            </>
                        )}
                    </select>
                </div>
                <div className="form-group f2">
                    <label>Status</label>
                    <select defaultValue="" name="ativo" onChange={handleSearch}>
                        <option value="">Todos</option>
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                    </select>
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit">
                        <FaSearch /> Localizar
                    </ButtonMotion>
                    <ButtonMotion onClick={() => navigate('/usuariosCadastrar')} className="purpleBtn" type="button">
                        <FaPlus /> Cadastrar Sub Conta
                    </ButtonMotion>
                </div>
            </div>
        </form>
    )
};

export default SearchUsuarios;
