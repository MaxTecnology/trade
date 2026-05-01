import { FaSearch } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { BsCalendarDate } from "react-icons/bs";
import filters from '@/store/filters';
import SearchInput from "@/components/Search/SearchInput";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import UsuariosOptions from "@/components/Options/UsuariosOptions";

const ContasSearch = () => {
    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/transacoesCadastrar")
    }
    const handleSearch = (e) => {
        filters.table[e.target.name] = e.target.value
        console.log(filters)
    }

    return (
        <form action="" className="containerSearch">
            <div className="searchRow special">
                <SearchInput />
                <div className="form-group f2">
                    <input readOnly style={{ display: "none" }} type="text" id="idVendedor" name="idVendedor" defaultValue={0} required />
                    <label className="required-field-label">Associado</label>
                    <select required id="planoAssociado" defaultValue={""} name="Associado" onChange={handleSearch}>
                        <option value="" disabled>
                            Selecione
                        </option>
                        <UsuariosOptions />
                    </select>
                </div>
                <div className="form-group f2">
                    <div className="customDateField">
                        <div><BsCalendarDate />
                            <label htmlFor="data">Período</label>
                        </div>
                        <div className='flex justify-around'>
                            <input type="date" name="data" id="" />
                            <input type="date" name="data" id="" />
                        </div>
                    </div>
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit"><FaSearch /> Pesquisar</ButtonMotion>
                    <ButtonMotion onClick={handleclick} className="purpleBtn" type="button">Gerar PDF</ButtonMotion>
                </div>
            </div>

        </form>

    )
};

export default ContasSearch;
