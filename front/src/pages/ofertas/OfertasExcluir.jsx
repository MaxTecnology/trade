import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import SearchfieldOfertas from "@/components/Search/SearchfieldOfertas";
import { activePage } from "@/utils/functions/setActivePage";
import MinhasOfertasModal from "@/Modals/MinhasOfertasModal";
import OfertasTable from "@/components/Tables/OfertasTable";
import { columns } from "./constants";
import { useQueryOfertas } from "@/hooks/ReactQuery/useQueryOfertas";
import useModal from "@/hooks/useModal";

const OfertasMinhas = () => {
    const { data } = useQueryOfertas()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState({ nome: "", porcentagem: "" })
    const [id, setId] = useState()

    useEffect(() => {
        activePage("ofertas")
    }, []);

    return (
        <div className="container">
            <MinhasOfertasModal
                isOpen={modalIsOpen}
                modalToggle={modalToggle}
                ofertaInfo={info}
                id={id}
                admin={true}
            />
            <div className="containerHeader">Excluir Ofertas</div>
            <SearchfieldOfertas />
            <div className="containerList">
                <OfertasTable
                    columns={columns}
                    data={data && data.ofertas ? data.ofertas : []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                    admin
                />
            </div>
            <Footer />
        </div>
    )
};

export default OfertasMinhas;
