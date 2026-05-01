import { useQueryAgencias } from '@/hooks/ReactQuery/useQueryAgencias';
const AgenciasOptions = ({ voucher }) => {
    const { data } = useQueryAgencias();

    return (
        <>
            {data && data.data ?
                data.data.map((item, index) => (
                    <option
                        value={item.nomeFantasia}
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

export default AgenciasOptions;
