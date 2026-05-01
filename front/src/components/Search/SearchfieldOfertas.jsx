import SearchInput from './SearchInput';
import { FaSearch, FaPlus } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import AgenciasOptions from '@/components/Options/AgenciasOptions';
import filters from '@/store/filters';
import CategoriesOptions from '@/components/Options/CategoriesOptions';
import { useEffect } from 'react';
import ButtonMotion from '@/components/FramerMotion/ButtonMotion';
const SearchfieldOfertas = () => {
    const navigate = useNavigate();
    const handleclick = ({ type }) => {
        navigate("/ofertasCadastrar")
    }

    const handleSearch = (e) => {
        filters.table[e.target.name] = e.target.value
    }

    useEffect(() => {
        filters.table = {}
    }, [])

    return (
        <form action="" className="containerSearch">
            <div className="searchRow">
                <SearchInput />
                <div className="form-group f2">
                    <label>Agência</label>
                    <select defaultValue={""} className="form-control" id="categoria" name="agencia" required onChange={handleSearch} >
                        <option value="" disabled>Selecionar</option>
                        <option value="" >Nenhuma</option>
                        <AgenciasOptions />
                    </select>
                </div>
                <div className="form-group f2">
                    <label htmlFor="nomePlano">Titulo</label>
                    <input type="text" id="nomePlano" name="titulo" onChange={handleSearch} />
                </div>
            </div>
            <div className="searchRow">
                <div className="form-group f2">
                    <label htmlFor="nomePlano">Cidade</label>
                    <input type="text" id="nomePlano" name="cidade" onChange={handleSearch} />
                </div>
                <div className="form-group f2"><label>Categoria</label>
                    <select defaultValue={""} className="form-control" id="categoria" name="nomeCategoria" required >
                        <option value="" disabled>Selecionar</option>
                        <CategoriesOptions />
                    </select>
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">Tipo</label>
                    <select name="tipo" defaultValue={""} required onChange={handleSearch}>
                        <option value="" disabled>Selecionar</option>
                        <option value="Produto">Produto</option>
                        <option value="Serviço">Serviço</option>
                    </select>
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit"><FaSearch /> Localizar</ButtonMotion>
                    <ButtonMotion onClick={handleclick} className="purpleBtn" type="button"><FaPlus /> Nova Oferta</ButtonMotion>
                </div>
            </div>

        </form>

    )
};

export default SearchfieldOfertas;
