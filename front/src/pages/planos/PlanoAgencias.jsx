import { useEffect, useState } from "react";
import { createItem, getDate } from "@/hooks/ListasHook";
import EditarPlanoModal from '@/Modals/EditarPlanoModa';
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import { toast } from "sonner";
import PlanosTable from "@/components/Tables/PlanosTable";
import { columns } from "./constants";
import useModal from "@/hooks/useModal";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";
import { setPlano } from "./setPlano";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const PlanoAgencias = () => {
    const revalidate = useRevalidate()
    const { data } = useQueryPlanos()
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({})
    const [id, setId] = useState()

    useEffect(() => { activePage("planos") }, []);

    const formHandler = (event) => {
        event.preventDefault()
        toast.promise(createItem(event, "planos"), {
            loading: 'Cadastrando dados...',
            success: () => {
                event.target.reset()
                revalidate("planos")
                return "Plano criado com sucesso!"
            },
            error: 'Erro ao cadastrar!'
        })
    }

    return (
        <div className="container">
            <EditarPlanoModal
                isOpen={modalIsOpen}
                modalToggle={modalToggle}
                url={`planos/${id}`}
                info={info}
                tipoPlano="agencia"
            />
            <div className="containerHeader">Planos Agências</div>
            <form onSubmit={formHandler} className="containerSearch">
                <div className="searchRow">
                    <div className="form-group f2">
                        <label>Nome do Plano</label>
                        <input type="text" name="nome" required />
                    </div>
                    <div className="form-group f2">
                        <label>Taxa de Comissão %</label>
                        <input type="number" step="0.01" name="percentualComissao" required placeholder="Ex: 2.5" />
                    </div>
                    <div className="form-group f2">
                        <label>Data de Criação</label>
                        <input type="text" value={getDate()} readOnly />
                    </div>
                    <input type="hidden" name="tipoPlano" value="agencia" />
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit" className="purpleBtn">Cadastrar</ButtonMotion>
                </div>
            </form>
            <div className="containerList">
                <PlanosTable
                    columns={columns}
                    data={data ? setPlano(data, "agencia") : []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default PlanoAgencias;
