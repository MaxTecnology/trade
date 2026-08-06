import { useEffect, useState } from "react";
import SearchFieldVoucher from '@/components/Search/SearchFieldVoucher';
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import VoucherTable from "@/components/Tables/VoucherTable";
import { useQueryEncaminhadasExtorno } from "@/hooks/ReactQuery/estornos/useQueryEncaminhadasExtorno";
import { useQueryExtornoMatriz } from "@/hooks/ReactQuery/estornos/useQueryExtornoMatriz";
import state from "@/store";
import { useSnapshot } from "valtio";
import { columns } from "@/pages/transacoes/extornoConstants";

// Cancelar voucher = estornar a transação por trás dele — mesmo fluxo de
// solicitação/aprovação de TransaçõesExtorno.jsx, exibido aqui na visão de Vouchers.
const CancelarVouchers = () => {
    const snap = useSnapshot(state);
    const isMatriz = snap.user?.tipo === "superadmin";

    const { data: agencia } = useQueryEncaminhadasExtorno()
    const { data: matriz } = useQueryExtornoMatriz()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    useEffect(() => {
        activePage("voucher")
    }, []);

    const dataToDisplay = isMatriz ? (matriz?.data ?? []) : (agencia?.data ?? []);

    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info}
                    voucher
                />
                : null}
            <div className="containerHeader">Cancelar Vouchers</div>
            <SearchFieldVoucher />
            <div className="containerList">
                <VoucherTable
                    columns={columns}
                    data={dataToDisplay}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    agencia={!isMatriz}
                    matriz={isMatriz}
                />
            </div>
            <Footer />
        </div>)
};

export default CancelarVouchers;
