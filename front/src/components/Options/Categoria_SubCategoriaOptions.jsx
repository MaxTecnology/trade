import { useEffect, useState } from 'react';
import { useQueryCategorias } from '@/hooks/ReactQuery/useQueryCategorias';

const Categoria_SubCategoriaOptions = ({ defaultValue, required }) => {
    const { data } = useQueryCategorias();
    const categorias = Array.isArray(data) ? data : [];

    const [selected, setSelected] = useState(null);
    const [sub, setSub] = useState('');

    useEffect(() => {
        if (defaultValue?.categoriaId && categorias.length > 0) {
            const found = categorias.find(c => c.id === defaultValue.categoriaId)
                ?? categorias.find(c => c.categoriasFilhas?.some(s => s.id === defaultValue.categoriaId))
                ?? null;
            setSelected(found);
        }
        if (defaultValue?.subcategoriaId) setSub(defaultValue.subcategoriaId);
    }, [defaultValue, data]);

    const categoryHandler = (e) => {
        const cat = categorias.find(c => c.id === e.target.value) ?? null;
        setSelected(cat);
        setSub('');
    };

    return (
        <>
            <div className="form-group">
                <label>Categoria</label>
                <select
                    defaultValue={defaultValue?.categoriaId ?? ''}
                    onChange={categoryHandler}
                    required={required}
                    name="categoriaIdSelect"
                >
                    <option value="" disabled>Selecione uma Categoria</option>
                    {categorias.map(item => (
                        <option value={item.id} key={item.id}>{item.nome}</option>
                    ))}
                </select>
            </div>
            <input type="hidden" name="categoriaId" value={selected?.id ?? defaultValue?.categoriaId ?? ''} />
            <div className="form-group">
                <label>Sub-Categoria</label>
                <select onChange={e => setSub(e.target.value)} value={sub} name="subcategoriaId">
                    <option value="">
                        {selected?.categoriasFilhas?.length > 0 ? 'Selecione uma Sub-Categoria' : 'Nenhuma Sub-Categoria'}
                    </option>
                    {selected?.categoriasFilhas?.map(item => (
                        <option value={item.id} key={item.id}>{item.nome}</option>
                    ))}
                </select>
            </div>
        </>
    );
};

export default Categoria_SubCategoriaOptions;
