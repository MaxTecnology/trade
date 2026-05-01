import { FaSearch } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
const SearchfieldExtrato = () => {
    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/ofertasCadastrar")
    }
    return (
        <form action="" className="containerSearch">
            <div className="searchRow">
                {/* <SearchInput /> */}
                <div className="form-group f1">
                    <label>Agência</label>
                    <select defaultValue={""} className="form-control" id="categoria" name="agencia" required >
                        <option value="" disabled>Selecionar</option>
                        {/* <SelectHook url="agencia" /> */}
                    </select>
                </div>
                <div className="form-group f1">
                    <input readOnly style={{ display: "none" }} type="text" id="idVendedor" name="idVendedor" defaultValue={0} required />
                    <label className="required-field-label">Associado</label>
                    <select required id="planoAssociado" defaultValue={""} name="nomeVendedor">
                        <option value="" disabled>
                            Selecione
                        </option>
                        {/* <SelectHook url="usuarios/tipo/meus/1" body={body} /> */}
                    </select>
                </div>
                <div className="form-group f1">
                    <label className="required-field-label" >Mês</label>
                    <select name="mes" defaultValue={""} required >
                        <option value="" disabled>Selecionar</option>
                        <option value="Produto">Produto</option>
                        <option value="Serviço">Serviço</option>
                    </select>
                </div>
                <div className="form-group f1">
                    <label className="required-field-label" >Ano</label>
                    <select name="ano" defaultValue={""} required >
                        <option value="" disabled>Selecionar</option>
                        <option value="Produto">Produto</option>
                        <option value="Serviço">Serviço</option>
                    </select>
                </div>
            </div>
            <div className="buttonContainer">
                <button type="submit"><FaSearch /> Pesquisar</button>
                <button onClick={handleclick} className="purpleBtn" type="button">Gerar PDF</button>
            </div>
        </form>

    )
};

export default SearchfieldExtrato;
