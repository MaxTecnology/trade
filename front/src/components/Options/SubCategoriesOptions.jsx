import { useQueryCategorias } from '@/hooks/ReactQuery/useQueryCategorias';
const SubCategoriesOptions = ({ filter }) => {
    const { data } = useQueryCategorias();
    function filterSub(data) {
        if (!Array.isArray(data) || !filter) return []
        const categoria = data.find((category) => category.id === filter)
        return categoria?.categoriasFilhas ?? []
    }
    return (
        <>
            {filter ? data ?
                <>
                    <option value="null">Nenhuma</option>
                    {filterSub(data).map((item) => (
                        <option
                            value={item.id}
                            id={item.id}
                            key={item.id}
                        >
                            {item.nome}
                        </option>
                    ))}
                </>
                : <option disabled value="null">Nenhuma Sub-Categoria</option> : null}
        </>
    )
};

export default SubCategoriesOptions;
