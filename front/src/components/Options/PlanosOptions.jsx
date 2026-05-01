import { useQueryPlanos } from '@/hooks/ReactQuery/useQueryPlanos';
import { setPlano } from '@/pages/planos/setPlano';
const PlanosOptions = ({ type, complex }) => {
    const { data } = useQueryPlanos();
    const value = setPlano(data, type)

    return (
        <>
            {data && value && value.length > 0 ?
                value.map((item, index) => (
                    <option
                        value={complex ? JSON.stringify(item) : item.idPlano}
                        id={item.idPlano}
                        key={item.idPlano + index}
                    >
                        {item.nomePlano}
                    </option>
                ))
                : <option disabled>Nenhum Plano Disponivel</option>}
        </>
    )
};

export default PlanosOptions;
