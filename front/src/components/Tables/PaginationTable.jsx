import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

const PaginationTable = ({ table }) => {
    return <>
        <div className="flex items-center justify-center pt-4 pb-4">
            {table.getPageCount() > 1 &&
                <nav className="rounded flex items-center justify-center border  border-zinc-300 text-center h-[30px]">
                    <div className="border-r h-full border-zinc-300 flex items-center w-[30px] justify-center" >
                        <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="border-none" >
                            <IoIosArrowBack />
                        </button>
                    </div>
                    {table.getPageCount() > 1 && (
                        <ul className="flex h-full">
                            {Array.from({ length: table.getPageCount() }, (_, index) => (
                                <li key={index} className={`outline-none cursor-pointer border-r border-zinc-300 w-[30px] flex items-center justify-center`}>
                                    <button type="button" onClick={() => table.setPageIndex(index)} className={`border-none outline-none focus:outline-none ${table.getState().pagination.pageIndex === index ? 'text-sky-400' : ''}`}>
                                        {index + 1}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className=" flex items-center w-[30px] justify-center">
                        <button type="button" className="border-none" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            <IoIosArrowForward />
                        </button>
                    </div>

                </nav>
            }
        </div>
    </>
};

export default PaginationTable;
