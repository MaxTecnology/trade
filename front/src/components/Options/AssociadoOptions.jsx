import { useQueryAssociados } from '@/hooks/ReactQuery/useQueryAssociados';
import { podeListarTodosAssociados } from '@/hooks/getId';
const AssociadoOptions = ({ voucher }) => {
    // GET /associados só aceita superadmin/agency_admin — evita 403 em loop
    // pra quem não é (associate_admin/operator, agency_operator).
    const { data } = useQueryAssociados(podeListarTodosAssociados());

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
