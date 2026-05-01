import { useQueryAssociados } from '@/hooks/ReactQuery/useQueryAssociados';
const AssociadoOptions = ({ voucher }) => {
    const { data } = useQueryAssociados();

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

export default AssociadoOptions;
