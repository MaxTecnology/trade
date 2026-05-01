import { useEffect, useState } from "react";
import SearchFieldVoucher from '@/components/Search/SearchFieldVoucher';
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import { useQueryVoucher } from "@/hooks/ReactQuery/useQueryVoucher";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import VoucherTable from "@/components/Tables/VoucherTable";
import { columns } from "./constants";

const CancelarVouchers = () => {
    const { data } = useQueryVoucher()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    useEffect(() => {
        activePage("voucher")
    }, []);

    console.log(data)
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
                    data={data && data.transacoesComVoucher ? data.transacoesComVoucher : []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default CancelarVouchers;
