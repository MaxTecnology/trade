import { useEffect, useState } from "react";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import Footer from "@/components/Footer";
import SearchfieldTrade from "@/components/Search/SearchfieldTrade";
import { activePage } from "@/utils/functions/setActivePage";
import TransacoesTable from "@/components/Tables/TransacoesTable";
import { columns } from "@/pages/estratos/constantsTransacoes";
import { useQueryRelatorioTransacoes } from "@/hooks/ReactQuery/useQueryRelatorioTransacoes";
import useModal from "@/hooks/useModal";
import state from "@/store";
import { useSnapshot } from "valtio";

// Visão ampla (Matriz vê tudo, Agência vê a própria conta + associados
// geridos) — GET /relatorios/permutas, mesma fonte já usada em Extratos.jsx.
// Diferente de "Minhas Transações" (TransaçõesMinhas.jsx), que usa
// GET /transacoes, escopado só pela própria conta do requisitante.
const Transações = () => {
    const snap = useSnapshot(state);
    const isMatriz = snap.user?.tipo === "superadmin";
    const { data } = useQueryRelatorioTransacoes()
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({})
    const [id, setId] = useState()

    useEffect(() => {
        activePage("transações")
    }, []);

    // Botão "Estornar" só aparece aqui pra linhas de crédito da Matriz ainda
    // não estornadas, e só pro superadmin — é o único jeito de acessar o
    // estorno de credito() (não passa nem por "Minhas Transações": a conta da
    // Matriz nunca é contaOrigem/contaDestino de um crédito, já que ela emite
    // RT sem debitar de si mesma — ver decisão de produto de 2026-09-26).
    const podeEstornarCredito = (transacao) =>
        isMatriz && transacao.tipo === 'credito' && transacao.status !== 'estornada';

    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info} // Substitua associadoData pelo seu objeto associado
                />
                : null}
            <div className="containerHeader">Transações</div>
            <SearchfieldTrade />
            <div className="containerList">
                <TransacoesTable
                    columns={columns}
                    data={data?.data ?? []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    type={podeEstornarCredito}
                />
            </div>
            <Footer />
        </div>)
};

export default Transações;
