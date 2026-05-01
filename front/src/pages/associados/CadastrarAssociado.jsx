import { useEffect, useState } from "react";
import { ColorRing } from 'react-loader-spinner'
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import { toast } from "sonner";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import { useSnapshot } from "valtio";
import state from "@/store";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import Form_InformacoesUsuario from "@/components/Form/Form_InformacoesUsuario";
import Form_Contato from "@/components/Form/Form_Contato";
import Form_Endereço from "@/components/Form/Form_Endereço";
import Form_Agencia from "@/components/Form/Form_Agencia";
import Form_Operacoes from "@/components/Form/Form_Operacoes";
import Form_Dados from "@/components/Form/Form_Dados";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { associadoSchema } from "@/models/schemas/associadoSchema";
import { createUser } from "@/utils/functions/api";

const CadastrarAssociado = () => {
    const snap = useSnapshot(state);
    const [imagem, setImagem] = useState(null);
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        activePage("associados")
    }, []);

    const revalidate = useRevalidate()

    const form = useForm({
        resolver: zodResolver(associadoSchema),
        defaultValues: {
            email: "",
            password: "",
            imagem: "",
            cpf: "",
            tipo: "",
            status: "",
            subcategoriaId: "null",
            categoriaId: "null",
            formaPagamento: "",
            dataVencimentoFatura: "",
            tipoOperacao: "",
            aceitaOrcamento: "",
            aceitaVoucher: "",
            gerente: "",
            mostrarNoSite: "",
            planoId: "",

            // INVISIBLE
            reputacao: 0,
            nomeFranquia: snap.user.nomeFantasia,
            usuarioCriadorId: snap.user.idUsuario,
            tipoDeMoeda: "R$",
            statusConta: true,
            taxaRepasseMatriz: 0,
        },
    });

    const formHandler = async (event) => {
        event.imagem = imagem
        console.table(event)
        setLoading(true)
        toast.promise(createUser(event, "usuarios/criar-usuario"), {
            loading: 'Cadastrando Associado...',
            success: () => {
                setLoading(false)
                form.reset()
                revalidate("associados")
                return "Associado Cadastrado com sucesso!"
            },
            error: (error) => {
                setLoading(false)
                return `Erro: ${error.message}`
            },
        })
    }
    return (
        <div className="container">
            <div className="containerHeader">Novo Associado</div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(formHandler)}
                    className="containerForm">
                    <Form_InformacoesUsuario form={form} type={"Associado"} />
                    <div className="formDivider">
                        <p>Contato</p>
                    </div>
                    <Form_Contato form={form} type={"Associado"} />
                    <div className="formDivider">
                        <p>Endereço</p>
                    </div>
                    <Form_Endereço form={form} type={"Associado"} />
                    <div className="formDivider">
                        <p>Agência</p>
                    </div>
                    <Form_Agencia form={form} type={"Associado"} />
                    <div className="formDivider">
                        <p>Operações</p>
                    </div>
                    <Form_Operacoes form={form} type={"Associado"} />
                    <div className="formDivider">
                        <p>Dados do usuário</p>
                    </div>
                    <Form_Dados form={form} setImagem={setImagem} />
                    <div className="buttonContainer">
                        {loading
                            ? <ColorRing
                                visible={loading}
                                height="33"
                                width="80"
                                ariaLabel="blocks-loading"
                                wrapperStyle={{}}
                                wrapperClass="blocks-wrapper"
                                colors={['#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf']}
                            />
                            : <ButtonMotion className="purpleBtn" type="submit">Cadastrar</ButtonMotion>}
                    </div>
                </form>
            </Form>
            <Footer />
        </div>)
};

export default CadastrarAssociado;
