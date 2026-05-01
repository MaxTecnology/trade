import { useSnapshot } from "valtio";
import { formatarNumeroParaReal } from "../../../hooks/Functions";
import state from "../../../store";

const LimiteCredito = () => {
    const snap = useSnapshot(state);
    const limiteCredito = snap.user && snap.user.conta.limiteCredito ? snap.user.conta.limiteCredito : 0
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
