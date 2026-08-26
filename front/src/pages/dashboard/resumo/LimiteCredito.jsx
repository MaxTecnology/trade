import { formatarNumeroParaReal } from "../../../hooks/Functions";
import { useQuerySaldoConta } from "@/hooks/ReactQuery/dashboard/useQuerySaldoConta";

const LimiteCredito = () => {
    const { data } = useQuerySaldoConta();
    const limiteCredito = Number(data?.data?.limiteCredito ?? 0)
    return (
        <div>
            Limite de Crédito:
            <p className={`${limiteCredito >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {`RT$ ${formatarNumeroParaReal(limiteCredito)}`}
            </p>
        </div>
    )
};

export default LimiteCredito;
