import { FaSearch } from "react-icons/fa";
import { BsCalendarDate } from "react-icons/bs";
import filters from '@/store/filters';
import SearchInput from "@/components/Search/SearchInput";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import { useQueryAssociadosDiretorio } from "@/hooks/ReactQuery/useQueryAssociadosDiretorio";

// onGerarPdf: opcional — quando informado, o botão "Gerar PDF" chama essa
// função com as linhas já carregadas na tela (ver ContasReceber/ContasPagar).
const ContasSearch = ({ onGerarPdf }) => {
    const { data: associadosResp } = useQueryAssociadosDiretorio();
    const associados = associadosResp?.data ?? [];

    const handleSearch = (e) => {
        filters.table[e.target.name] = e.target.value
    }

    return (
        <form action="" onSubmit={(e) => e.preventDefault()} className="containerSearch">
            <div className="searchRow special">
                <SearchInput />
                <div className="form-group f2">
                    <label>Associado</label>
                    <select defaultValue={""} name="associado-filtro" onChange={handleSearch}>
                        <option value="">Todos</option>
                        {associados.map((item) => (
                            <option value={item.id} key={item.id}>
                                {item.nomeFantasia || item.nome}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group f2">
                    <div className="customDateField">
                        <div><BsCalendarDate />
                            <label htmlFor="data">Vencimento</label>
                        </div>
                        <div className='flex justify-around'>
                            <input type="date" name="dataInicio" onChange={handleSearch} />
                            <input type="date" name="dataTermino" onChange={handleSearch} />
                        </div>
                    </div>
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit"><FaSearch /> Pesquisar</ButtonMotion>
                    {onGerarPdf ? (
                        <ButtonMotion onClick={onGerarPdf} className="purpleBtn" type="button">Gerar PDF</ButtonMotion>
                    ) : null}
                </div>
            </div>

        </form>

    )
};

export default ContasSearch;
