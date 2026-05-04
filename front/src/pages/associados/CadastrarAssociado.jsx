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
import api from "@/services/api";

const tipoOperacaoMap = { "1": "compra", "2": "venda", "3": "compra_venda" }

// FormInputMoney stores "RT$ 1.234,56" — convert back to float
const parseMoney = (val) => {
    if (!val) return undefined
    const cleaned = String(val).replace(/[^0-9,]/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : num
}

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

    const uploadImagem = async () => {
        if (!imagem) return undefined
        const fd = new FormData()
        fd.append('file', imagem)
        const res = await api.post('upload', fd)
        return res.data?.data?.url ?? res.data?.url
    }

    const formHandler = async (data) => {
        setLoading(true)

        // tipoAtendimento: presencial|online|voucher
        const tipoAtendimento = ["presencial"]
        if (data.aceitaVoucher === true || data.aceitaVoucher === "true") tipoAtendimento.push("voucher")

        let imagemUrl
        try {
            imagemUrl = await uploadImagem()
        } catch (err) {
            setLoading(false)
            toast.error(`Erro ao enviar imagem: ${err?.response?.data?.message ?? err.message}`)
            return
        }

        const payload = {
            imagemUrl,
            // Empresa
            nome: data.razaoSocial,
            nomeFantasia: data.nomeFantasia || undefined,
            cnpj: data.cnpj,
            descricao: data.descricao || undefined,
            inscEstadual: data.inscEstadual || undefined,
            inscMunicipal: data.inscMunicipal || undefined,
            restricao: data.restricao || undefined,
            mostrarNoSite: data.mostrarNoSite === "true" || data.mostrarNoSite === true,
            aceitaOrcamento: data.aceitaOrcamento === "true" || data.aceitaOrcamento === true,
            categoriaId: data.subcategoriaId && data.subcategoriaId !== "null" ? data.subcategoriaId
                : data.categoriaId && data.categoriaId !== "null" ? data.categoriaId
                : undefined,

            // Contato principal
            email: data.email,
            telefone: data.telefone || undefined,

            // Contato secundário
            nomeContato: data.nomeContato || undefined,
            celular: data.celular || undefined,
            emailContato: data.emailContato || undefined,
            emailSecundario: data.emailSecundario || undefined,
            site: data.site || undefined,

            // Endereço
            logradouro: data.logradouro || undefined,
            numero: data.numero || undefined,
            complemento: data.complemento || undefined,
            bairro: data.bairro || undefined,
            cidade: data.cidade,
            estado: data.estado?.slice(0, 2),
            cep: data.cep || undefined,
            regiao: data.regiao || undefined,

            // Vinculação
            agenciaId: snap.user?.tipo === 'agency_admin' ? snap.user.entityId : (data.agenciaId || undefined),
            gerenteId: data.gerente || undefined,
            planoId: data.planoId,
            tipoAtendimento,

            // Operacional
            tipoOperacao: tipoOperacaoMap[String(data.tipoOperacao)] || undefined,
            formaPagamento: data.formaPagamento ? Number(data.formaPagamento) : undefined,
            diaVencimentoFatura: data.dataVencimentoFatura ? Number(data.dataVencimentoFatura) : undefined,
            valorInscricaoBRL: parseMoney(data.valorInscricaoBRL),
            valorInscricaoRT: parseMoney(data.valorInscricaoRT),
            limiteCredito: parseMoney(data.limiteCredito),
            limiteVendaMensal: parseMoney(data.limiteVendaMensal),
            limiteVendaTotal: parseMoney(data.limiteVendaTotal),

            // Acesso
            senha: data.senha,
            cpf: data.cpf || undefined,
        }

        toast.promise(
            api.post("associados", payload).catch((err) => {
                throw new Error(err?.response?.data?.message ?? "Erro ao cadastrar")
            }),
            {
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
            }
        )
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
