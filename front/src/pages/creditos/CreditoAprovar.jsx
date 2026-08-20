import { useEffect, useState } from "react";
import Footer from '@/components/Footer';
import CreditosModal from "@/Modals/CreditosModal";
import SearchfieldCredito from "@/components/Search/SearchfieldCredito";
import { activePage } from "@/utils/functions/setActivePage";
import CreditosTable from "@/components/Tables/CreditosTable";
import { columns } from "./constantCreditos";
import useModal from "@/hooks/useModal";
import { useQueryCreditosAnalisar } from "@/hooks/ReactQuery/useQueryCreditosAnalisar";
import { useQueryCreditosAprovar } from "@/hooks/ReactQuery/useQueryCreditosAprovar";
import { isAgencia, isMatriz } from "@/hooks/getId";

const CreditoAprovar = () => {
    // Só busca a lista que corresponde a quem está logado — GET /creditos/filhos
    // é agency_admin/operator-only, GET /creditos/matriz é superadmin-only.
    const { data: creditosFilhos, refetch: refetchFilhos } = useQueryCreditosAnalisar(isAgencia())
    const { data: creditosMatriz, refetch: refetchMatriz } = useQueryCreditosAprovar(isMatriz())
    const [id, setId] = useState("");
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState()

    useEffect(() => {
        activePage("creditos")
    }, []);

    const data = isMatriz() ? creditosMatriz?.data ?? [] : creditosFilhos?.data ?? []
    const refetch = () => { refetchFilhos(); refetchMatriz() }

    return (
        <div className="container">
            {modalIsOpen ?
                <CreditosModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info}
                    setState={refetch}
                />
                : null}
            <div className="containerHeader">Creditos a Aprovar</div>
            <SearchfieldCredito />
            <div className="containerList">
                <CreditosTable
                    columns={columns}
                    data={data}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default CreditoAprovar;
