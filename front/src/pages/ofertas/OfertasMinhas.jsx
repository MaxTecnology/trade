import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import SearchfieldOfertas from "@/components/Search/SearchfieldOfertas";
import { activePage } from "@/utils/functions/setActivePage";
import MinhasOfertasModal from "@/Modals/MinhasOfertasModal";
import OfertasTable from "@/components/Tables/OfertasTable";
import { columns } from "./constants";
import useModal from "@/hooks/useModal";
import { useQueryMinhaLoja } from "@/hooks/ReactQuery/useQueryOfertas";

const OfertasMinhas = () => {
    const { data } = useQueryMinhaLoja()
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
            />
            <div className="containerHeader">Minhas Ofertas</div>
            <SearchfieldOfertas type={"list"} />
            <div className="containerList">
                <OfertasTable
                    columns={columns}
                    data={data?.data ?? []}
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
