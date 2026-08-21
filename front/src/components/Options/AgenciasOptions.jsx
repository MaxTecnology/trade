import { useQueryAgencias } from '@/hooks/ReactQuery/useQueryAgencias';
import { isMatriz } from '@/hooks/getId';

// value: id da agência (UUID) — use 'nome' prop para exibir nome como value
const AgenciasOptions = () => {
    // GET /agencias só aceita superadmin — evita 403 em loop de retry
    // pra quem não é Matriz (Associado/Agência não listam outras agências).
    const { data } = useQueryAgencias(isMatriz());

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
