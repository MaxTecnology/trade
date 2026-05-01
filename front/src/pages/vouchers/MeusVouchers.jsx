import { useEffect, useState } from "react";
import SearchFieldVoucher from '@/components/Search/SearchFieldVoucher';
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import useModal from "@/hooks/useModal";
import { columns } from "./MeusVochersConstants";
import VoucherTable from "@/components/Tables/VoucherTable";
import { useQueryVoucherUsuario } from "@/hooks/ReactQuery/useQueryVoucherUsuario";
import TransaçõesModal from "@/Modals/TransaçõesModal";

const MeusVouchers = () => {
    const { data } = useQueryVoucherUsuario()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    useEffect(() => {
        activePage("voucher")
    }, []);

    const filteredData = data && data.transacoesComprador ? data.transacoesComprador.concat(data.transacoesVendedor) : []
    console.log(filteredData)
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
            <div className="containerHeader">Meus Vouchers</div>
            <SearchFieldVoucher />
            <div className="containerList">
                <VoucherTable
                    columns={columns}
                    data={filteredData}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default MeusVouchers;
