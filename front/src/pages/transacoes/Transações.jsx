import { useEffect, useState } from "react";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import Footer from "@/components/Footer";
import SearchfieldTrade from "@/components/Search/SearchfieldTrade";
import { activePage } from "@/utils/functions/setActivePage";
import TransacoesTable from "@/components/Tables/TransacoesTable";
import { columns } from "@/pages/estratos/constantsTransacoes";
import { useQueryRelatorioTransacoes } from "@/hooks/ReactQuery/useQueryRelatorioTransacoes";
import useModal from "@/hooks/useModal";

// Visão ampla (Matriz vê tudo, Agência vê a própria conta + associados
// geridos) — GET /relatorios/permutas, mesma fonte já usada em Extratos.jsx.
// Diferente de "Minhas Transações" (TransaçõesMinhas.jsx), que usa
// GET /transacoes, escopado só pela própria conta do requisitante.
const Transações = () => {
    const { data } = useQueryRelatorioTransacoes()
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({})
    const [id, setId] = useState()

    useEffect(() => {
        activePage("transações")
    }, []);

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
                />
            </div>
            <Footer />
        </div>)
};

export default Transações;
