import { useState } from "react";
import Logo from "../assets/images/Logo2.png"
import Teste from "../assets/images/imgteste.jpeg"
import "./Login.css"
import { RiEye2Line, RiEyeCloseFill } from "react-icons/ri";
import { loginUser } from "../hooks/ListasHook";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import { Navigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import state from "@/store";
import { useQueryLogin } from "@/hooks/ReactQuery/useQueryLogin";
import ForgotPassword from "./ForgotPassword";

const Login = () => {
    const { data, isLoading } = useQueryLogin();
    const snap = useSnapshot(state);
    const [type, setType] = useState("password")
    const [loading, setLoading] = useState(false)
    const [recover, setRecover] = useState(false)
    const revalidate = useRevalidate()

    const typeToggle = () => {
        if (type === "password") {
            setType("text")
        } else {
            setType("password")
        }
    }

    if (isLoading) {
        return null
    }

    if (snap.logged) {
        if (snap.logged !== false) {
            return <Navigate to="/" />
        }
    }
    return (
        <div className="loginPage">
            <div className="loginImage">
                <img src={Teste} alt="login-image" />
            </div>
            <div className="loginContainer">

                {recover ? <ForgotPassword setState={setRecover} /> : (
                    <form action="post" onSubmit={(event) => loginUser(event, setLoading, revalidate)}>
                        <img src={Logo} alt="" />
                        <div>
                            <input type="text" name="login" placeholder="E-mail ou Conta" required />
                        </div>
                        <div>
                            <input name="senha" type={type} placeholder="Senha" required />
                            {type === "password" ?
                                <RiEye2Line className="passwordIcon" onClick={typeToggle} />
                                : <RiEyeCloseFill className="passwordIcon" onClick={typeToggle} />
                            }
                        </div>
                        <div className="loginInputContainer">
                            <div>
                                <input type="checkbox" name="Lembre-me" placeholder="Lembre-me" id="" />
                                <p>Lembre-me</p>
                            </div>
                            <p onClick={() => setRecover(true)} className="cursor-pointer">Esqueceu a senha?</p>
                        </div>
                        <div className="buttonContainer">
                            {loading ? <div className="loading"></div> : <button className="!w-full !p-5 !text-[14px]" type="submit">Entrar</button>}
                        </div>
                        {/* <div>
                            Não tem conta? <span>Cadastre-se</span>
                        </div> */}
                    </form>
                )}
            </div>
        </div>)
};

export default Login;
