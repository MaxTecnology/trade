import filters from "@/store/filters";
import { FaSearch } from "react-icons/fa";

const SearchInput = () => {
    const handleSearch = (e) => {
        filters.table[e.target.name] = e.target.value
        console.log(filters)
    }

    return (
        <div className="form-group f2 m10 searchInput">
            <label htmlFor="nomePlano">Pesquisar</label>
            <input
                type="text"
                id="search"
                name="search"
                onChange={handleSearch}
                placeholder="Pesquisar..."
            />
            <FaSearch className="icon" />
        </div>
    );
};

export default SearchInput;