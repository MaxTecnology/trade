
import Logo from "../assets/images/Logo2.png"
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { newPassword } from "@/utils/functions/api";
import { useState } from "react";
import FormInput from "@/components/Form/formItens/FormInput";
import { useNavigate } from "react-router-dom";

const passwordSchema = z.object({
    password: z.string({ required_error: "Senha obrigatória" }).min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
    confirmPassword: z.string({ required_error: "Senha obrigatória" }).min(6, { message: "Senhas devem ser iguais" })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Senhas devem ser iguais",
    path: ["confirmPassword"],
});
const ResetPassword = () => {
    const [loading, setLoading] = useState(false)
    const form = useForm({
        resolver: zodResolver(passwordSchema)
    });

    const navigate = useNavigate();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const token = urlParams.get('token');
    function formHandler(event) {
        const data = {
            novaSenha: event.password,
            token: token
        }
        console.log(token)
        setLoading(true)
        toast.promise(newPassword(data, id), {
            loading: 'Redefinindo senha...',
            success: (result) => {
                setLoading(false)
                form.reset()
                navigate('/login')
                return result
            },
            error: (error) => {
                setLoading(false)
                return `Erro: ${error.message}`
            },
        })
    }
    return (
        <div className="w-full h-full bg-slate-600 display flex items-center text-center justify-center">
            <Form {...form}>
                <form action="post" className="bg-white border p-10 shadow rounded-md flex flex-col gap-4 min-w-[300px] w-full max-w-[500px]" onSubmit={form.handleSubmit(formHandler)}>
                    <img src={Logo} alt="" className="w-full h-14" />
                    <h3 className="text-center text-lg font-bold">Esqueceu a senha?</h3>
                    <FormInput required form={form} name="password" label="Insira sua nova senha" placeholder="******" type={"password"} variant="bottom" />
                    <FormInput required form={form} name="confirmPassword" label="Insira sua nova senha novamente" placeholder="******" type={"password"} variant={"bottom"} />
                    <div className="buttonContainer">
                        <button className="!w-full !p-5 !text-[14px]" type="submit" disabled={loading}>Confirmar código</button>
                    </div>
                </form>

            </Form>

        </div>
    )
};

export default ResetPassword;
