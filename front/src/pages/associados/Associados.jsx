import { useEffect, useState } from "react";
import SearchField from '@/components/Search/SearchField';
import AssociadosCard from "./AssociadosCard";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import { useQueryAssociados } from "@/hooks/ReactQuery/useQueryAssociados";
import PaginationCards from "@/components/cards/PaginationCards";
import { useSnapshot } from "valtio";
import state from "@/store";

const Associados = () => {
    useSnapshot(state);
    const { data } = useQueryAssociados();
    const [currentPage, setCurrentPage] = useState(1);
    const [cardsPerPage, setCardsPerPage] = useState(6);
    const user = state.user

    useEffect(() => {
        activePage("associados")
    }, []);

    const filteredData = data && Array.isArray(data.data) ? data.data.filter(associado => associado.status === 'ativo') : [];

    const lastCardIndex = currentPage * cardsPerPage;
    const firstCardIndex = lastCardIndex - cardsPerPage;
    const currentCards = filteredData ? filteredData.slice(firstCardIndex, lastCardIndex) : [];

    return (
        <div className="container">
            <div className="containerHeader">Associados</div>
            <SearchField />
            <div className="associadosCardContainer">
                {currentCards.map((filho, index) => (
                    <AssociadosCard associado={filho} key={index} index={index} />
                ))}
            </div>
            <PaginationCards cardsPerPage={cardsPerPage} totalCards={filteredData.length} setCurrentPage={setCurrentPage} currentPage={currentPage} />
            <Footer />
        </div>
    )
};

export default Associados;
