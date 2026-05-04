import { useEffect } from "react";
import InputMask from 'react-input-mask';
import { createUser } from "@/hooks/ListasHook";
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import { toast } from "sonner";
import PlanosFields from "@/components/Form/PlanosFields";
import { useSnapshot } from "valtio";
import state from "@/store";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import AgenciasOptions from "@/components/Options/AgenciasOptions";

const GerentesCadastrar = () => {
    const snap = useSnapshot(state);
    const revalidate = useRevalidate()

    useEffect(() => { activePage("gerentes") }, []);

    const formHandler = (event) => {
        event.preventDefault()
        toast.promise(createUser(event, "gerentes"), {
            loading: 'Cadastrando Gerente...',
            success: () => {
                event.target.reset()
                revalidate("gerentes")
                return "Gerente cadastrado com sucesso!"
            },
            error: (error) => `Erro: ${error.message}`,
        })
    }

    return (
        <div className="container">
            <div className="containerHeader">Novo Gerente</div>
            <form onSubmit={formHandler} className="containerForm">
                {/* Dados da Empresa */}
                <div className="formDivider"><p>Dados da Empresa</p></div>
                <div className="form-group f4">
                    <label className="required">Nome</label>
                    <input type="text" name="nome" required />
                </div>
                <div className="form-group f2">
                    <label className="required">CNPJ</label>
                    <InputMask mask="99.999.999/9999-99" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" name="cnpj" required />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label>Telefone</label>
                    <InputMask mask="(99)99999-9999" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" name="telefone" />}
                    </InputMask>
                </div>

                {/* Endereço */}
                <div className="formDivider"><p>Endereço</p></div>
                <div className="form-group f4">
                    <label>Logradouro</label>
                    <input type="text" name="logradouro" />
                </div>
                <div className="form-group f2">
                    <label className="required">Cidade</label>
                    <input type="text" name="cidade" required />
                </div>
                <div className="form-group f1">
                    <label className="required">Estado (UF)</label>
                    <input type="text" name="estado" maxLength={2} required />
                </div>
                <div className="form-group f1">
                    <label>CEP</label>
                    <InputMask mask="99999-999" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" name="cep" />}
                    </InputMask>
                </div>

                {/* Plano */}
                <div className="formDivider"><p>Plano</p></div>
                {snap.user?.tipo === 'superadmin' ? (
                    <div className="form-group f2">
                        <label>Agência <small>(deixe em branco para Matriz)</small></label>
                        <select name="agenciaId" defaultValue="">
                            <option value="">Matriz (sem agência)</option>
                            <AgenciasOptions />
                        </select>
                    </div>
                ) : (
                    <>
                        <div className="form-group f2">
                            <label>Agência</label>
                            <input type="text" className="readOnly" readOnly value={snap.user?.nomeFantasia ?? ''} />
                        </div>
                        <input type="hidden" name="agenciaId" value={snap.user?.entityId ?? ''} />
                    </>
                )}
                <PlanosFields type="gerente" />

                {/* Acesso */}
                <div className="formDivider"><p>Dados de Acesso</p></div>
                <div className="form-group f2">
                    <label className="required">E-mail</label>
                    <input type="email" name="email" required />
                </div>
                <div className="form-group f2">
                    <label className="required">Senha</label>
                    <input type="password" name="senha" required minLength={8} />
                </div>

                <div className="buttonContainer">
                    <ButtonMotion type="submit" className="purpleBtn">Cadastrar</ButtonMotion>
                </div>
            </form>
            <Footer />
        </div>
    )
};

export default GerentesCadastrar;
