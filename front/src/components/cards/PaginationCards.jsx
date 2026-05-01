import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io"

const PaginationCards = ({ cardsPerPage, totalCards, setCurrentPage, currentPage }) => {
    let pages = []

    for (let i = 1; i <= Math.ceil(totalCards / cardsPerPage); i++) {
        pages.push(i)
    }

    if (1 >= pages.length) {
        return null;
    }

    return (
        <div className="flex items-center justify-center">
            <nav className="rounded flex items-center justify-center border  border-zinc-300 text-center h-[30px]">
                <div className="border-r h-full border-zinc-300 flex items-center w-[30px] justify-center" >
                    <button type="button" className="border-none" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                        <IoIosArrowBack />
                    </button>
                </div>
                <ul className="flex h-full">
                    {pages.map((page, index) => (
                        <li key={index} className={`outline-none cursor-pointer border-r border-zinc-300 w-[30px] flex items-center justify-center`}>

                            <button
                                type="button"
                                className={`border-none outline-none focus:outline-none ${currentPage === index + 1 ? 'text-sky-400' : ''}`}
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </button>
                        </li>
                    ))}
                </ul>
                <div className=" flex items-center w-[30px] justify-center">
                    <button type="button" className="border-none" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === pages.length}>
                        <IoIosArrowForward />
                    </button>
                </div>
            </nav>
        </div>
    )
}
export default PaginationCards;
