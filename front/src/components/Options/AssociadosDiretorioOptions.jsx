import { useQueryAssociadosDiretorio } from '@/hooks/ReactQuery/useQueryAssociadosDiretorio';

const AssociadosDiretorioOptions = ({ voucher }) => {
    const { data } = useQueryAssociadosDiretorio();
    const associados = data?.data ?? [];

    const filtered = voucher
        ? associados.filter((item) => item.tipoAtendimento?.includes('voucher'))
        : associados;

    if (filtered.length === 0) {
        return <option disabled>{voucher ? 'Nenhum associado aceita voucher' : 'Nenhum associado disponível'}</option>;
    }

    return (
        <>
            {filtered.map((item) => (
                <option value={JSON.stringify(item)} key={item.id}>
                    {item.nomeFantasia || item.nome}
                </option>
            ))}
        </>
    );
};

export default AssociadosDiretorioOptions;
