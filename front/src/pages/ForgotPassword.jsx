
import { forgotPassword } from "@/utils/functions/api";
import Logo from "../assets/images/Logo2.png"
import { toast } from "sonner";
const ForgotPassword = ({ setState }) => {
    function formHandler(event) {
        event.preventDefault()
        toast.promise(forgotPassword(event), {
            loading: 'Mandando email...',
            success: () => {
                event.target.reset()
                setState(false)
                return "Mensagem enviada para o seu e-mail!"
            },
            error: 'Erro ao solicitar redefinição!'
        })
    }
    return (
        <>
            <form action="post" onSubmit={(event) => formHandler(event)}>
                <img src={Logo} alt="" />
                <h3 className="text-center text-lg font-bold">Esqueceu a senha?</h3>
                <div className="flex flex-col">
                    <p className="w-full text-left">Insira seu e-mail</p>
                    <input type="email" name="email" placeholder="E-mail" required />
                </div>
                <div className="buttonContainer">
                    <button className="!w-full !p-5 !text-[14px]" type="submit">Enviar Solicitação</button>
                </div>
                <div>
                    <span onClick={(state) => setState(!state)} className="cursor-pointer">Voltar ao Login</span>
                </div>
            </form>
        </>
    )
};

export default ForgotPassword;
