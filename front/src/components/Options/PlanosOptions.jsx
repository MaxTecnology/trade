import { useQueryPlanos } from '@/hooks/ReactQuery/useQueryPlanos';
import { setPlano } from '@/pages/planos/setPlano';

// type: 'agencia' | 'associado' | 'gerente'
// complex: passa o objeto JSON como value (para exibir campos readonly ao selecionar)
const PlanosOptions = ({ type, complex }) => {
    const { data } = useQueryPlanos();
    const planos = setPlano(data, type)

    return (
        <>
            {planos && planos.length > 0
                ? planos.map((item, index) => (
                    <option
                        value={complex ? JSON.stringify(item) : item.id}
                        id={item.id}
                        key={item.id + index}
                    >
                        {item.nome}
                    </option>
                ))
                : <option disabled>Nenhum Plano Disponível</option>}
        </>
    )
};

export default PlanosOptions;
