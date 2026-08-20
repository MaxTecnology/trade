import { useEffect, useState } from "react";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import Footer from "@/components/Footer";
import SearchfieldTrade from "@/components/Search/SearchfieldTrade";
import { activePage } from "@/utils/functions/setActivePage";
import TransacoesTable from "@/components/Tables/TransacoesTable";
import useModal from "@/hooks/useModal";
import { useQueryTransacoes } from "@/hooks/ReactQuery/useQueryTransacoes";
import { StatusTransacaoCell } from "@/utils/functions/tables/statusTransacao";

const columns = [
    {
        id: "comprador",
        accessorKey: 'comprador.nome',
        header: 'Comprador',
    },
    {
        id: "vendedor",
        accessorKey: 'vendedor.nome',
        header: 'Vendedor',
    },
    {
        accessorKey: 'descricao',
        header: 'Descrição',
    },
    {
        accessorKey: 'criadoEm',
        header: 'Data',
    },
    {
        accessorKey: 'valorRT',
        header: 'Valor RT$',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: StatusTransacaoCell,
    },
]

const TransaçõesMinhas = () => {
    const { data } = useQueryTransacoes()
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({})
    useEffect(() => {
        activePage("transações")
    }, []);

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
                    data={data?.data ?? []}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    type
                />
            </div>
            <Footer />
        </div>)
};

export default TransaçõesMinhas;
