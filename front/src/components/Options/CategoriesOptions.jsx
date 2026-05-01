import { useQueryCategorias } from '@/hooks/ReactQuery/useQueryCategorias';
const CategoriesOptions = () => {
    const { data } = useQueryCategorias();
    return (
        <>
            {data && data.categorias ?
                data.categorias.map((item, index) => (
                    <option
                        value={item.idCategoria}
                        id={item.idCategoria}
                        key={item.idCategoria + index}
                    >
                        {item.nomeCategoria}
                    </option>
                ))
                : <option disabled>Nenhuma Categoria</option>}
        </>
    )
};

export default CategoriesOptions;
