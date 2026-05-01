import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import SearchfieldOfertas from "@/components/Search/SearchfieldOfertas";
import { getId } from "@/hooks/getId";
import { activePage } from "@/utils/functions/setActivePage";
import MinhasOfertasModal from "@/Modals/MinhasOfertasModal";
import OfertasTable from "@/components/Tables/OfertasTable";
import { columns } from "./constants";
import useModal from "@/hooks/useModal";
import { useQueryOfertas } from "@/hooks/ReactQuery/useQueryOfertas";

const OfertasMinhas = () => {
    const { data } = useQueryOfertas()
    const [modalIsOpen, modalToggle] = useModal(false);
    const [info, setInfo] = useState({ nome: "", porcentagem: "" })
    const [id, setId] = useState()

    useEffect(() => {
        activePage("ofertas")
    }, []);

    const filter = (data) => {
        var ofertas = []
        data.map((item) => {
            if (item.usuarioId === getId()) {
                ofertas.push(item)
            }
        })
        return ofertas
    }

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
                    data={data && data.ofertas ? filter(data.ofertas) : []}
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
