import { useQueryCategorias } from '@/hooks/ReactQuery/useQueryCategorias';
const SubCategoriesOptions = ({ filter }) => {
    const { data } = useQueryCategorias();
    function filterSub(data) {
        if (data && data.categorias) {
            if (filter) {
                const filteredCategories = data.categorias.filter(category => category.idCategoria == filter);
                // Obtém apenas os valores das subcategorias
                const subcategoryValues = filteredCategories.flatMap(category => category.subcategorias);
                return subcategoryValues;
            }
            // // Filtra as categorias que têm subcategorias
            // const filteredCategories = data.categorias.filter(category => category.subcategorias.length > 0);
            // // Obtém apenas os valores das subcategorias
            // const subcategoryValues = filteredCategories.flatMap(category => category.subcategorias);
            // return subcategoryValues;
        }

        return []
    }
    return (
        <>
            {filter ? data ?
                <>
                    <option value="null">Nenhuma</option>
                    {filterSub(data).map((item, index) => (
                        <option
                            value={item.idSubcategoria || null}
                            id={item.idSubcategoria}
                            key={item.idSubcategoria + index}
                        >
                            {item.nomeSubcategoria}
                        </option>
                    ))}
                </>
                : <option disabled value="null">Nenhuma Sub-Categoria</option> : null}
        </>
    )
};

export default SubCategoriesOptions;
