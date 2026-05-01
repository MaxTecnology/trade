import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import Form_Dados from "@/components/Form/Form_Dados";
import { zodResolver } from "@hookform/resolvers/zod";
import FormPermissions from "@/components/Form/permissions/FormPermissions";
import { permissionSchema } from "@/models/schemas/permissionsSchema";
import { createSubAccount } from "@/utils/functions/api";
import { toast } from "sonner";
import { ColorRing } from "react-loader-spinner";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const UsuariosCadastrar = () => {
    const [loading, setLoading] = useState(false)
    const [userImage, setImagem] = useState(null)
    useEffect(() => {
        activePage("usuarios")
    }, []);
    const form = useForm({
        resolver: zodResolver(permissionSchema),
        defaultValues: {
            email: "",
            password: "",
            imagem: "",
            cpf: "",
        },
    });
    const formHandler = async (event) => {
        event.imagem = userImage
        toast.promise(createSubAccount(event), {
            loading: 'Cadastrando Sub-Conta...',
            success: () => {
                setLoading(false)
                return "Sub-Conta Cadastrada com sucesso!"
            },
            error: (error) => {
                setLoading(false)
                return `Erro: ${error.message}`
            },
        })
        // form.reset()
    }
    return (
        <div className="container">
            <div className="containerHeader">Nova Sub-Conta</div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(formHandler)} className="containerForm">
                    <Form_Dados form={form} setImagem={setImagem} />
                    <div className="formDivider">
                        <p>Permissões</p>
                    </div>
                    <FormPermissions form={form} />
                    <div className="buttonContainer">
                        {loading ? <ColorRing
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
        </div>
    )
};

export default UsuariosCadastrar;
