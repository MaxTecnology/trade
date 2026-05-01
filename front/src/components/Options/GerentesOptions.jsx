import { useQueryGerentes } from '@/hooks/ReactQuery/useQueryGerentes';
const GerentesOptions = () => {
    const { data } = useQueryGerentes();

    return (
        <>
            {data && data.data ?
                data.data.map((item, index) => (
                    <option
                        value={item.idUsuario}
                        id={item.nomeFantasia}
                        key={index}
                    >
                        {item.nomeFantasia}
                    </option>
                ))
                : <option disabled>Nenhuma Agência Disponivel</option>
            }
        </>
    )
};

export default GerentesOptions;
