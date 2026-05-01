import { useEffect, useState } from 'react';
import { useQueryCategorias } from '@/hooks/ReactQuery/useQueryCategorias';
const Categoria_SubCategoriaOptions = ({ defaultValue, required }) => {
    const { data } = useQueryCategorias();
    const [selected, setSelected] = useState(null)
    const [sub, setSub] = useState("")
    const [defaultCategoria, setDefaultCategoria] = useState(null)
    useEffect(() => {
        if (defaultValue) {
            const defaultPlan = data ? data.categorias.find(p => p.idCategoria === defaultValue.categoriaId) : null
            setDefaultCategoria(defaultPlan)
            setSelected(defaultPlan)
            if (defaultValue.subcategoriaId) setSub(defaultValue.subcategoriaId)
        }
    }, [defaultValue, data, defaultCategoria])

    const categoryHandler = (e) => {
        var selectedIndex = e.selectedIndex;
        // Obtém o option selecionado usando o índice
        var selectedOption = e.options[selectedIndex];

        // Obtém o ID do option selecionado
        var selectedOptionId = selectedOption.id;
        setSelected(JSON.parse(selectedOptionId))
    }

    return (
        <>
            <div className="form-group">
                <label>Categoria</label>
                <select defaultValue={defaultValue && defaultValue.categoriaId ? defaultValue.categoriaId : ""} onChange={(e) => {
                    setSub("")
                    categoryHandler(e.target)
                }} required={required}>
                    <option value="" disabled>Selecione uma Categoria</option>
                    {data && data.categorias ?
                        data.categorias.map((item, index) => (
                            <option
                                value={item.idCategoria}
                                id={JSON.stringify(item)}
                                key={item.idCategoria}
                            >
                                {item.nomeCategoria}
                            </option>
                        ))
                        : <option disabled>Nenhuma Categoria</option>}
                </select>
            </div>
            <input type="hidden" name="categoriaId" value={selected ? selected.idCategoria : defaultCategoria?.idCategoria} />
            <div className="form-group">
                <label>Sub-Categoria</label>
                <select
                    onChange={(e) => setSub(e.target.value)}
                    value={sub}
                    name="subcategoriaId"
                >
                    <option disabled value="">
                        {
                            selected && selected?.subcategorias.length > 0 ? "Selecione uma Sub-Categoria" : "Nenhuma Sub-Categoria"
                        }
                    </option>
                    {selected && selected?.subcategorias.length > 0 ?
                        selected.subcategorias.map((item, index) => {
                            return (
                                <option value={item.idSubcategoria} key={index}>
                                    {item.nomeSubcategoria}
                                </option>
                            )
                        })
                        : null}
                </select>
            </div>

        </>
    )
};

export default Categoria_SubCategoriaOptions;
