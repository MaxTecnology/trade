import { useEffect, useState } from "react";
import OfertasCard from "./OfertasCard";
import Footer from "@/components/Footer";
import SearchfieldOfertas from "@/components/Search/SearchfieldOfertas";
import { activePage } from "@/utils/functions/setActivePage";
import { useQueryOfertas } from "@/hooks/ReactQuery/useQueryOfertas";
import PaginationCards from "@/components/cards/PaginationCards";

const Ofertas = () => {
    const { data } = useQueryOfertas()

    useEffect(() => {
        activePage("ofertas")
    }, []);

    const active = data && data.ofertas ? data.ofertas.filter(oferta => oferta.status === true) : [];

    const [currentPage, setCurrentPage] = useState(1);
    const [cardsPerPage, setCardsPerPage] = useState(3);

    const lastCardIndex = currentPage * cardsPerPage;
    const firstCardIndex = lastCardIndex - cardsPerPage;
    const currentCards = active.slice(firstCardIndex, lastCardIndex)


    return (
        <div className="container">
            <div className="containerHeader">Ofertas</div>
            <SearchfieldOfertas />
            <div className="associadosCardContainer">
                {currentCards.map((filho, index) => (
                    <OfertasCard associado={filho} key={index} index={index} />
                ))}
            </div>
            <PaginationCards cardsPerPage={cardsPerPage} totalCards={data && data.data ? data.data.length : 0} setCurrentPage={setCurrentPage} currentPage={currentPage} />
            <Footer />
        </div>
    )
};

export default Ofertas;
