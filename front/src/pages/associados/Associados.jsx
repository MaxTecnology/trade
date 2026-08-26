import { useEffect, useState } from "react";
import SearchField from '@/components/Search/SearchField';
import AssociadosCard from "./AssociadosCard";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import { useQueryAssociadosDiretorio } from "@/hooks/ReactQuery/useQueryAssociadosDiretorio";
import PaginationCards from "@/components/cards/PaginationCards";
import { useSnapshot } from "valtio";
import filters from "@/store/filters";

const norm = (value) => String(value ?? '').toLowerCase().trim();

const Associados = () => {
    const snap = useSnapshot(filters.table);
    const { data } = useQueryAssociadosDiretorio();
    const [currentPage, setCurrentPage] = useState(1);
    const [cardsPerPage] = useState(6);

    useEffect(() => {
        activePage("associados")
    }, []);

    // Zera a paginação sempre que um filtro muda — senão fica preso numa
    // página que deixou de existir depois que a lista encolheu.
    useEffect(() => {
        setCurrentPage(1)
    }, [snap.search, snap.agencia, snap.categoriaId, snap.account, snap.estado, snap.cidade]);

    const filteredData = (data && Array.isArray(data.data) ? data.data : [])
        .filter(associado => associado.status === 'ativo')
        .filter(associado => !snap.search || norm(associado.nome).includes(norm(snap.search)) || norm(associado.nomeFantasia).includes(norm(snap.search)))
        .filter(associado => !snap.agencia || associado.agenciaId === snap.agencia)
        .filter(associado => !snap.categoriaId || associado.categoriaId === snap.categoriaId)
        .filter(associado => !snap.account || norm(associado.conta?.numero).includes(norm(snap.account)))
        .filter(associado => !snap.estado || associado.estado === snap.estado)
        .filter(associado => !snap.cidade || norm(associado.cidade).includes(norm(snap.cidade)));

    const lastCardIndex = currentPage * cardsPerPage;
    const firstCardIndex = lastCardIndex - cardsPerPage;
    const currentCards = filteredData.slice(firstCardIndex, lastCardIndex);

    return (
        <div className="container">
            <div className="containerHeader">Associados</div>
            <SearchField />
            <div className="associadosCardContainer">
                {currentCards.map((filho, index) => (
                    <AssociadosCard associado={filho} key={filho.id ?? index} index={index} />
                ))}
            </div>
            <PaginationCards cardsPerPage={cardsPerPage} totalCards={filteredData.length} setCurrentPage={setCurrentPage} currentPage={currentPage} />
            <Footer />
        </div>
    )
};

export default Associados;
