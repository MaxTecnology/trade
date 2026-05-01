import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";

const SortColumn = ({ header }) => {
    return <>
        {
            header.column.getIsSorted() === "asc" ? (
                <FaSortUp size={14} onClick={header.column.getToggleSortingHandler()} />
            ) : header.column.getIsSorted() === "desc" ? (
                <FaSortDown size={14} onClick={header.column.getToggleSortingHandler()} />
            ) : <FaSort size={14} onClick={header.column.getToggleSortingHandler()} />
        }
    </>
};

export default SortColumn;
