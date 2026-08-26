import { formatarNumeroParaReal } from "@/hooks/Functions";
import { useQuerySaldoConta } from "@/hooks/ReactQuery/dashboard/useQuerySaldoConta";

const SaldoPermutas = () => {
    const { data } = useQuerySaldoConta();
    const saldoPermuta = Number(data?.data?.saldo ?? 0)
    return (
        <div>
            Saldo em Permutas:
            <p className={`${saldoPermuta >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {`RT$ ${formatarNumeroParaReal(saldoPermuta)}`}
            </p>
        </div>
    )
};

export default SaldoPermutas;
