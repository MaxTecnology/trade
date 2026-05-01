import { formatDate } from "@/hooks/ListasHook";
import state from "@/store";
import { useState } from "react";
import { useSnapshot } from "valtio";

const UltimaTransação = () => {
    const snap = useSnapshot(state.user);
    const [ultimaTransacao, setUltimaTransacao] = useState(0);
    const data = snap && snap.transacoesComprador ? snap.transacoesComprador.concat(snap.transacoesVendedor) : [];


    // Encontrar a transação mais recente
    for (const transacao of data) {
        if (transacao && transacao.createdAt && !ultimaTransacao) {
            setUltimaTransacao(transacao.createdAt)
        } else if (transacao && transacao.createdAt > ultimaTransacao) {
            setUltimaTransacao(transacao.createdAt)
        }
    }

    return (
        <div>
            Ultima Transação:
            <span>{ultimaTransacao ? formatDate(ultimaTransacao) : "Sem transações"}</span>
        </div>
    );
};

export default UltimaTransação;
