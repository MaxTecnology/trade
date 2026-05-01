import SearchInput from './SearchInput';
import { FaSearch, FaPlus } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import ButtonMotion from '@/components/FramerMotion/ButtonMotion';
const SearchfieldCredito = () => {
    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/creditosSolicitar")
    }
    return (
        <form action="" className="containerSearch">
            <div className="searchRow">
                <SearchInput />
                <div className="form-group f2">
                    <label>Agência</label>
                    <select defaultValue={""} className="form-control" name="agencia" required >
                        <option value="" disabled>Selecionar</option>
                    </select>
                </div>
                <div className="form-group f2">
                    <label htmlFor="nomePlano">Nome Fantasia</label>
                    <input type="text" name="nomeFantasia" />
                </div>
            </div>
            <div className="searchRow">
                <div className="form-group f2">
                    <label htmlFor="nomePlano">CNPJ</label>
                    <input type="text" id="nomePlano" name="cnpj" />
                </div>
                <div className="form-group f2">
                    <label htmlFor="nomePlano">E-mail</label>
                    <input type="email" id="nomePlano" name="email" />
                </div>
                <div className="form-group f2">
                    <label className="required-field-label" >Status</label>
                    <select name="tipo" defaultValue={""} required >
                        <option value="" disabled>Selecionar</option>
                        <option value="Serviço">Em Analise</option>
                        <option value="Serviço">Em Processamento</option>
                        <option value="Produto">Aprovada</option>
                        <option value="Serviço">Recusada</option>


                    </select>
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit"><FaSearch /> Pesquisar</ButtonMotion>
                    <ButtonMotion onClick={handleclick} className="purpleBtn" type="button"><FaPlus /> Solicitar Crédito</ButtonMotion>
                </div>
            </div>

        </form>

    )
};

export default SearchfieldCredito;
