import { useQueryCategorias } from '@/hooks/ReactQuery/useQueryCategorias';
const CategoriesOptions = () => {
    const { data } = useQueryCategorias();
    return (
        <>
            {data && data.length > 0
                ? data.map((item, index) => (
                    <option
                        value={item.id}
                        id={item.id}
                        key={item.id + index}
                    >
                        {item.nome}
                    </option>
                ))
                : <option disabled>Nenhuma Categoria</option>}
        </>
    )
};

export default CategoriesOptions;
