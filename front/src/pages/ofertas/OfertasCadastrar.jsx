import { useEffect, useState } from "react";
import Mascaras from "@/hooks/Mascaras";
import { createOferta } from "@/hooks/ListasHook";
import defaultImage from '@/assets/images/default_img.png';
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import RealInput from '@/components/Inputs/CampoMoeda';
import { activePage } from "@/utils/functions/setActivePage";
import { BiSolidImageAdd } from "react-icons/bi";
import CategoriesOptions from "@/components/Options/CategoriesOptions";
import { toast } from "sonner";
import { imageReferenceHandler } from "@/utils/functions/formHandler";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";

const OfertasCadastrar = () => {
    const [loading, setLoading] = useState(false)
    const [reference, setReference] = useState(true)
    const [imagemReference, setImageReference] = useState(null);
    const revalidate = useRevalidate();
    const url = "ofertas"
    const navigate = useNavigate();
    const handleclick = () => {
        navigate("/ofertas")
    }

    useEffect(() => {
        Mascaras()
        activePage("ofertas")
    }, []);

    const formHandler = (event) => {
        event.preventDefault()
        setReference(false);
        setLoading(true)
        setTimeout(() => {
            toast.promise(createOferta(event, url), {
                loading: 'Cadastrando oferta...',
                success: () => {
                    setLoading(false)
                    revalidate("ofertas")
                    setImageReference(null)
                    return <b>Oferta Cadastrada com sucesso!</b>
                },
                error: (error) => {
                    setLoading(false)
                    return <b>Erro ao Cadastrar Oferta: {error.message}</b>
                },
            })
            setReference(true)
        }, 300
        )
    }

    return (
        <div className="container">
            <div className="containerHeader">Nova Oferta</div>
            <form onSubmit={(event) => formHandler(event)} className="containerForm ofertasContainer">
                <div className="ofertasTop">
                    <div className="ofertasImageContainer">
                        <img src={imagemReference ? imagemReference : defaultImage} className="rounded float-left img-fluid" alt="..." name="imagem-selecionada" />
                    </div>
                    <div className="ofertasRightside">
                        <div className="containerRow">
                            <div className="form-group f1">
                                <label className="required-field-label">Titulo</label>
                                <input type="text" className="form-control" id="razaoSocial" name="titulo" required />
                            </div>
                            <div className="form-group f1">
                                <label className="required-field-label">Categorias</label>
                                <select id="planoAssociado" defaultValue={""} name="categoriaId" required>
                                    <option value="" disabled>
                                        Selecione
                                    </option>
                                    <CategoriesOptions />
                                </select>
                            </div>
                            <div className="form-group f2">
                                <label className="required-field-label">Tipo de Atendimento</label>
                                <select name="tipoAtendimento" multiple required>
                                    <option value="presencial">Presencial</option>
                                    <option value="online">Online</option>
                                    <option value="voucher">Voucher</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group f4 desc">
                            <label className="required-field-label">Descrição</label>
                            <textarea maxLength="150" minLength="10" type="text" rows={9} name="descricao" required />
                        </div>
                    </div>
                </div>
                <div className="containerRow">
                    <div className="form-group">
                        <label htmlFor="img_path" className="inputLabel">
                            <BiSolidImageAdd /> Selecione uma imagem
                            <input type="file" accept="image/*" className="custom-file-input" id="img_path" name="imagens" onChange={(e) => imageReferenceHandler(e, setImageReference)} />
                        </label>
                    </div>
                    <div className="form-group"></div>
                    <div className="form-group"></div>
                </div>

                <div className="containerRow">
                    <div className="form-group f2">
                        <label className="required-field-label">Quantidade Disponível</label>
                        <input type="number" min="1" className="form-control" id="nomeContato" name="quantidadeDisponivel" required />
                    </div>
                    <div className="form-group f2">
                        <label className="required-field-label">Valor (RT)</label>
                        <RealInput name="valorRT" reference={reference} required />
                    </div>
                </div>
                <div className="containerRow">
                    <div className="form-group f2">
                        <label>Vencimento</label>
                        <input type="datetime-local" className="form-control" name="vencimento" />
                    </div>
                    <div className="form-group f2">
                        <label className="required-field-label">Cidade</label>
                        <input type="text" className="form-control" name="cidade" required />
                    </div>
                    <div className="form-group f1">
                        <label className="required-field-label">Estado</label>
                        <input type="text" maxLength="2" className="form-control" name="estado" required />
                    </div>
                </div>

                <div className="buttonContainer">
                    <ButtonMotion onClick={handleclick} type="button">Voltar</ButtonMotion>
                    <ButtonMotion className="purpleBtn" type="submit" disabled={loading}>Cadastrar</ButtonMotion>
                </div>
            </form>
            <Footer />
        </div>)
};

export default OfertasCadastrar;
