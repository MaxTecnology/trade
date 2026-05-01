import { useEffect, useState } from "react";
import { createItem, getDate } from "@/hooks/ListasHook";
import EditarPlanoModal from '@/Modals/EditarPlanoModa';
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import { toast } from "sonner";
import PlanosTable from "@/components/Tables/PlanosTable";
import { columns } from "./constants";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";
import useModal from "@/hooks/useModal";
import { setPlano } from "./setPlano";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const PlanoGerente = () => {
    const revalidate = useRevalidate()
    const { data } = useQueryPlanos()
    const [modalIsOpen, modalToggle] = useModal();
    const [info, setInfo] = useState({})
    const [id, setId] = useState()
    const body = { tipo: "Gerente" }


    useEffect(() => {
        activePage("planos")
    }, []);

    const formHandler = (event) => {
        event.preventDefault()
        setTimeout(() => {
            toast.promise(createItem(event, "planos/criar-plano"), {
                loading: 'Cadastrando dados...',
                success: () => {
                    event.target.reset()
                    revalidate("planos")
                    return "Plano criado com sucesso!"
                },
                error: 'Erro ao cadastrar!'
            })
        }, 200);
    }


    return (
        <div className="container">
            <EditarPlanoModal
                isOpen={modalIsOpen}
                modalToggle={modalToggle}
                url={`planos/atualizar-plano/${id}`}
                info={info}
                body={body}
            />
            <div className="containerHeader">Planos Gerente</div>
            <form onSubmit={(event) => formHandler(event)} className="containerSearch">
                <div className="searchRow">
                    <div className="form-group f2">
                        <label htmlFor="nomePlano">Nome do Plano</label>
                        <input type="text" name="nomePlano" required />
                    </div>
                    <div className="form-group f2">
                        <label htmlFor="nomePlano">Taxa de Comissão</label>
                        <input type="number" name="taxaComissao" placeholder="Taxa %" required />
                    </div>
                    <div className="form-group f2">
                        <label htmlFor="data">Data de Criação</label>
                        <input type="text" id="data" value={getDate()} readOnly />
                    </div>
                    <input readOnly style={{ display: "none" }} type="text" name="tipoDoPlano" value={body.tipo} />
                    <input readOnly style={{ display: "none" }} type="text" name="taxaManutencaoAnual" value={0} />
                    <input readOnly style={{ display: "none" }} type="text" name="taxaInscricao" value={0} />
                </div>
                <div className="buttonContainer">
                    <ButtonMotion type="submit" className="purpleBtn">Cadastrar</ButtonMotion>
                </div>
            </form>
            <div className="containerList">
                <PlanosTable
                    columns={columns}
                    data={data ? setPlano(data, body.tipo) : []}
                    setId={setId}
                    setInfo={setInfo}
                    modaltoggle={modalToggle}
                />
            </div>
            <Footer />
        </div>)
};

export default PlanoGerente;
