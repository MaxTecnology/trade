import { useState } from "react";
import Footer from '@/components/Footer';
import ExtratosSearch from "@/components/Search/ExtratosSearch";
import useModal from "@/hooks/useModal";
import { columns } from "./constantsEstorno";
import ExtratosTable from "@/components/Tables/ExtratosTable";
import TransaçõesModal from "@/Modals/TransaçõesModal";
import { isMatriz, isAgencia } from "@/hooks/getId";
import { useQueryEncaminhadasExtorno } from "@/hooks/ReactQuery/estornos/useQueryEncaminhadasExtorno";
import { useQueryExtornoMatriz } from "@/hooks/ReactQuery/estornos/useQueryExtornoMatriz";

const ExtratosEstorno = () => {
    // ExtratosTable espera "Matriz"/"Agência" literal — mantém o contrato de
    // prop que o componente já usa, só resolve o valor certo pra passar.
    const tipoConta = isMatriz() ? "Matriz" : isAgencia() ? "Agência" : "Associado"
    // Só busca a lista que corresponde a quem está logado — GET /estornos/filhos
    // é agency_admin/operator-only, GET /estornos/matriz é superadmin-only.
    const { data: agenciaResp } = useQueryEncaminhadasExtorno(isAgencia())
    const { data: matrizResp } = useQueryExtornoMatriz(isMatriz())
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    const dataToDisplay = isMatriz()
        ? matrizResp?.data ?? []
        : agenciaResp?.data ?? []

    return (
        <div className="container">
            {modalIsOpen ?
                <TransaçõesModal
                    isOpen={true}
                    modalToggle={modalToggle}
                    info={info} // Substitua associadoData pelo seu objeto associado
                />
                : null}
            <div className="containerHeader">Estornos</div>
            <ExtratosSearch />
            <div className="containerList">
                <ExtratosTable
                    columns={columns}
                    data={dataToDisplay}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    type={tipoConta}
                />
            </div>
            <Footer />
        </div>)
};

export default ExtratosEstorno;
