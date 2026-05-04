import { useQueryAgencias } from '@/hooks/ReactQuery/useQueryAgencias';

// value: id da agência (UUID) — use 'nome' prop para exibir nome como value
const AgenciasOptions = () => {
    const { data } = useQueryAgencias();

    return (
        <>
            {Array.isArray(data) && data.length > 0
                ? data.map((item) => (
                    <option value={item.id} key={item.id}>
                        {item.nome}
                    </option>
                ))
                : <option disabled>Nenhuma Agência Disponível</option>
            }
        </>
    )
};

export default AgenciasOptions;
