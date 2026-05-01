import SearchInput from './SearchInput';
import { FaSearch, FaPlus } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import ButtonMotion from '@/components/FramerMotion/ButtonMotion';
import AgenciasOptions from '@/components/Options/AgenciasOptions';
import filters from '@/store/filters';
import { useEffect } from 'react';
const SearchFieldVoucher = () => {
    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/voucherCadastrar")
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
                    <label htmlFor='agencia'>Agência</label>
                    <select defaultValue={""} className="form-control" name="agencia" required onChange={handleSearch} >
                        <option value="" disabled>Selecionar</option>
                        <AgenciasOptions />
                    </select>
                </div>
                <div className="form-group f2">
                    <label htmlFor='comprador'>Comprador</label>
                    <input type="text" id="comprador" name="comprador" onChange={handleSearch} />
                </div>
            </div>
            <div className="searchRow">
                <div className="form-group f2">
                    <label htmlFor='vendedor'>Vendedor</label>
                    <input type="text" id="vendedor" name="vendedor" onChange={handleSearch} />
                </div>
                <div className="form-group f2">
                    <label>Status</label>
                    <select className="form-control" id="status" name="status" required onChange={handleSearch}>
                        <option value="">Selecionar</option>
                        <option value="Aprovada">Aprovada</option>
                        <option value="Extornada">Extornada</option>
                    </select>
                </div>
                <div className="form-group f2">
                    <label htmlFor="nomePlano">Data</label>
                    <input type="date" name="data" />
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit"><FaSearch /> Localizar</ButtonMotion>
                    <ButtonMotion onClick={handleclick} className="purpleBtn" type="button"><FaPlus />  Solicitar</ButtonMotion>
                </div>
            </div>

        </form>

    )
};

export default SearchFieldVoucher;
