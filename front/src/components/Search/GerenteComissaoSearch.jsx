import { FaSearch } from "react-icons/fa";
import filters from '@/store/filters';
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import { useQueryGerentes } from "@/hooks/ReactQuery/useQueryGerentes";

// Filtro da seção "A Pagar Gerentes" (tela Comissões) — escreve em
// filters.gerente, não filters.table, pra não colidir com o filtro de
// comissão da plataforma que já existe na mesma tela (ver store/filters.js).
// Nome do arquivo NÃO é "GerenteSearch.jsx" de propósito — esse nome já
// pertence ao filtro da tela "Gerentes" (cadastro/busca), componente
// completamente diferente; sobrescrevê-lo por engano quebraria aquela tela.
// "Pesquisar" é próprio aqui (não reaproveita o componente SearchInput
// compartilhado, que é hardcoded pra filters.table).
const GerenteComissaoSearch = () => {
    const { data: gerentes } = useQueryGerentes();

    const handleSearch = (e) => {
        filters.gerente[e.target.name] = e.target.value
    }

    return (
        <form action="" onSubmit={(e) => e.preventDefault()} className="containerSearch">
            <div className="searchRow special">
                <div className="form-group f2 m10 searchInput">
                    <label htmlFor="gerenteComissaoSearch">Pesquisar</label>
                    <input
                        type="text"
                        id="gerenteComissaoSearch"
                        name="search"
                        onChange={handleSearch}
                        placeholder="Pesquisar..."
                    />
                    <FaSearch className="icon" />
                </div>
                <div className="form-group f2">
                    <label>Gerente</label>
                    <select defaultValue={""} name="gerente-filtro" onChange={handleSearch}>
                        <option value="">Todos</option>
                        {(gerentes ?? []).map((item) => (
                            <option value={item.id} key={item.id}>
                                {item.nome}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit"><FaSearch /> Pesquisar</ButtonMotion>
                </div>
            </div>
        </form>
    )
};

export default GerenteComissaoSearch;
