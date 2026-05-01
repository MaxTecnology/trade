import { useEffect, useState } from "react";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import Footer from "@/components/Footer";
import SearchfieldTrade from "@/components/Search/SearchfieldTrade";
import { activePage } from "@/utils/functions/setActivePage";
import TransacoesTable from "@/components/Tables/TransacoesTable";
import { useSnapshot } from "valtio";
import state from "@/store";
import useModal from "@/hooks/useModal";

const columns = [
    {
        accessorKey: 'nomeComprador',
        header: 'Comprador',
    },
    {
        accessorKey: 'nomeVendedor',
        header: 'Vendedor',
    },
    {
        accessorKey: 'descricao',
        header: 'Descrição',
    },
    {
        accessorKey: 'createdAt',
        header: 'Data',
    },
    {
        accessorKey: 'valorRt',
        header: 'Valor RT$',
    },
    {
        accessorKey: 'status',
        header: 'Status',
    },
]

const TransaçõesMinhas = () => {
    const snap = useSnapshot(state);
    const data = snap.user ? snap.user.transacoesComprador.concat(snap.user.transacoesVendedor) : null
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({})
    useEffect(() => {
        activePage("transações")
    }, [data]);

    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info}
                />
                : null}
            <div className="containerHeader">Transações Minhas</div>
            <SearchfieldTrade />
            <div className="containerList">
                <TransacoesTable
                    columns={columns}
                    data={data ? data : []}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default TransaçõesMinhas;
