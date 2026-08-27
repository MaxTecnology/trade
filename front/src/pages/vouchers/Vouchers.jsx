import { useEffect, useState } from "react";
import EditarGerenteModal from '@/Modals/EditarGerenteModal';
import SearchFieldVoucher from '@/components/Search/SearchFieldVoucher';
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import VoucherTable from "@/components/Tables/VoucherTable";
import { columns } from "./constantsVouchersAdmin";
import { useQueryVouchersConsolidado } from "@/hooks/ReactQuery/useQueryVouchersConsolidado";
import TransaçõesModal from "@/Modals/TransaçõesModal";

const Vouchers = () => {
    const { data } = useQueryVouchersConsolidado()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    useEffect(() => {
        activePage("voucher")
    }, []);

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
            <div className="containerHeader">Vouchers</div>
            <SearchFieldVoucher />
            <div className="containerList">
                <VoucherTable
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

export default Vouchers;
