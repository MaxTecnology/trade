import { useQueryGerentes } from '@/hooks/ReactQuery/useQueryGerentes';

const GerentesOptions = () => {
    const { data } = useQueryGerentes();

    if (!Array.isArray(data) || data.length === 0) {
        return <option disabled>Nenhum gerente disponível</option>;
    }

    return data.map((item) => (
        <option key={item.id} value={item.id}>
            {item.nome}
        </option>
    ));
};

export default GerentesOptions;
