import { FaSearch } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { BsCalendarDate } from "react-icons/bs";
import filters from '@/store/filters';
import AgenciasOptions from '@/components/Options/AgenciasOptions';
import SearchInput from "@/components/Search/SearchInput";
import { useEffect } from "react";
import { activePage } from "@/utils/functions/setActivePage";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const ExtratosSearch = () => {
    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/transacoesCadastrar")
    }
    const handleSearch = (e) => {
        filters.table[e.target.name] = e.target.value
        console.log(filters)
    }

    useEffect(() => {
        activePage("extratos")
    }, []);

    useEffect(() => {
        filters.table = {}
    }, []);

    return (
        <form action="" className="containerSearch">
            <div className="searchRow special">
                <SearchInput />
                <div className="form-group f2">
                    <input readOnly style={{ display: "none" }} type="text" id="idVendedor" name="idVendedor" defaultValue={0} required />
                    <label className="required-field-label">Associado</label>
                    <select required id="planoAssociado" defaultValue={""} name="Associado">
                        <option value="" disabled>
                            Selecione
                        </option>
                    </select>
                </div>
                <div className="form-group f2">
                    <div className="customDateField">
                        <div><BsCalendarDate />
                            <label htmlFor="data">Período</label>
                        </div>
                        <div className='flex justify-around'>
                            <input type="date" name="dataInicio" id="" onChange={handleSearch} />
                            <input type="date" name="dataTermino" id="" onChange={handleSearch} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="searchRow">
                <div className="form-group f1">
                    <label htmlFor='agencia'>Agência</label>
                    <select defaultValue={""} className="form-control" id="categoria" name="agencia" required onChange={handleSearch} >
                        <option value="" disabled>Selecionar</option>
                        <option value="" >Nenhuma</option>
                        <AgenciasOptions />
                    </select>
                </div>
                <div className="form-group f1">
                    <label htmlFor="comprador">Comprador</label>
                    <input type="text" name="comprador" label="Comprador" onChange={handleSearch} />
                </div>
                <div className="form-group f1">
                    <label htmlFor="vendedor">Vendedor</label>
                    <input type="text" name="vendedor" label="Vendedor" onChange={handleSearch} />
                </div>
            </div>
            <div className="buttonContainer">
                <div className="buttonContainer">
                    <ButtonMotion type="submit">
                        <FaSearch /> Pesquisar
                    </ButtonMotion>
                    <ButtonMotion
                        onClick={handleclick}
                        className="purpleBtn"
                        type="button"
                    >
                        Gerar PDF
                    </ButtonMotion>
                </div>
            </div>
        </form>

    )
};

export default ExtratosSearch;
