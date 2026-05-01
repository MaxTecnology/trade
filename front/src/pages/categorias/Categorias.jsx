import { useEffect, useState } from "react";
import { createItem, getDate } from "@/hooks/ListasHook";
import EditarCategoriaModal from '@/Modals/EditarCategoriaModal';
import Footer from "@/components/Footer";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { activePage } from "@/utils/functions/setActivePage";
import { toast } from "sonner";
import CategoriasTable from "@/components/Tables/CategoriasTable";
import { useQueryCategorias } from "@/hooks/ReactQuery/useQueryCategorias";
import useModal from "@/hooks/useModal";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const columns = [
    {
        accessorKey: 'createdAt',
        header: 'Data',
    },
    {
        accessorKey: 'nomeCategoria',
        header: 'Nome da Categoria',
    },
]

const Categorias = () => {
    // Estados
    const { data } = useQueryCategorias()
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({ name: "", createAT: "" })
    const [id, setId] = useState()
    const revalidate = useRevalidate();

    useEffect(() => {
        activePage("categorias")
    }, []);

    // Funções
    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/subCategoria")
    }

    // Handlers
    const formHandler = (event) => {
        event.preventDefault()
        toast.promise(createItem(event, "categorias/criar-categoria"), {
            loading: 'Cadastrando dados...',
            success: () => {
                event.target.reset()
                revalidate('categorias')
                return "Categoria cadastrada com sucesso!"
            },
            error: 'Erro ao cadastrar!'
        })
    }

    return (
        <div className="container">
            <EditarCategoriaModal
                isOpen={modalIsOpen}
                modalToggle={() => modalToggle()}
                url={`categorias/atualizar-categoria/${id}`}
                info={info}
            />
            <div className="containerHeader">Categorias</div>
            <form onSubmit={(event) => { formHandler(event) }} className="containerSearch">
                <div className="searchRow">
                    <div className="form-group">
                        <label htmlFor="nomePlano">Nome da Categoria</label>
                        <input required type="text" name="nomeCategoria" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="data">Data:</label>
                        <input type="text" id="data" value={getDate()} readOnly />
                    </div>
                    <div className="form-group"></div>
                    <div className="buttonContainer">
                        <ButtonMotion type="submit">Cadastrar</ButtonMotion>
                        <ButtonMotion onClick={handleclick} className="purpleBtn" type="button"><FaPlus /> Nova Sub-Categoria</ButtonMotion>
                    </div>
                </div>
            </form>
            <div className="containerList">
                <CategoriasTable
                    columns={columns}
                    data={data?.categorias || []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default Categorias;
