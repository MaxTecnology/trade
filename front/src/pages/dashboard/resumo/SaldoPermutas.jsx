import { useSnapshot } from "valtio";
import { formatarNumeroParaReal } from "@/hooks/Functions";
import state from "@/store";

const SaldoPermutas = () => {
    const snap = useSnapshot(state);
    const saldoPermuta = snap.user && snap.user.conta.saldoPermuta ? snap.user.conta.saldoPermuta : 0
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
