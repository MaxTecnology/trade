import SearchInput from './SearchInput';
import { FaSearch, FaPlus } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import filters from '@/store/filters';
import CategoriesOptions from '@/components/Options/CategoriesOptions';
import { useEffect } from 'react';
import ButtonMotion from '@/components/FramerMotion/ButtonMotion';
// type="list" (Minhas Ofertas) ganha o filtro de Status, com "Ativas" já
// selecionado por padrão — nas outras telas que reaproveitam esse campo
// (marketplace público, Excluir Ofertas) esse filtro não faz sentido
// (marketplace só mostra ativa mesmo, Excluir Ofertas não tem essa noção).
const STATUS_OPTIONS = [
    { value: '', label: 'Todas' },
    { value: 'ativa', label: 'Ativas' },
    { value: 'pausada', label: 'Pausadas' },
    { value: 'fechada', label: 'Fechadas' },
]

const SearchfieldOfertas = ({ type }) => {
    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/ofertasCadastrar")
    }

    const handleSearch = (e) => {
        filters.table[e.target.name] = e.target.value
    }

    useEffect(() => {
        filters.table = type === 'list' ? { status: 'ativa' } : {}
    }, [type])

    return (
        <form action="" onSubmit={(e) => e.preventDefault()} className="containerSearch">
            <div className="searchRow">
                <SearchInput />
                <div className="form-group f2">
                    <label htmlFor="nomePlano">Titulo</label>
                    <input type="text" id="nomePlano" name="titulo" onChange={handleSearch} />
                </div>
                <div className="form-group f2">
                    <label htmlFor="nomePlano">Cidade</label>
                    <input type="text" id="nomePlano" name="cidade" onChange={handleSearch} />
                </div>
            </div>
            <div className="searchRow">
                <div className="form-group f2"><label>Categoria</label>
                    <select defaultValue={""} className="form-control" id="categoria" name="categoria" onChange={handleSearch}>
                        <option value="">Todas</option>
                        <CategoriesOptions />
                    </select>
                </div>
                {type === 'list' && (
                    <div className="form-group f2"><label htmlFor="status">Status</label>
                        <select defaultValue={"ativa"} className="form-control" id="status" name="status" onChange={handleSearch}>
                            {STATUS_OPTIONS.map((opt) => (
                                <option value={opt.value} key={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="buttonContainer">
                    <ButtonMotion type="submit"><FaSearch /> Localizar</ButtonMotion>
                    <ButtonMotion onClick={handleclick} className="purpleBtn" type="button"><FaPlus /> Nova Oferta</ButtonMotion>
                </div>
            </div>

        </form>

    )
};

export default SearchfieldOfertas;
