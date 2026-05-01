import { useEffect, useState } from "react";
import Mascaras from "@/hooks/Mascaras";
import { createOferta } from "@/hooks/ListasHook";
import defaultImage from '@/assets/images/default_img.png';
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import RealInput from '@/components/Inputs/CampoMoeda';
import { getId, getName } from '@/hooks/getId';
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
    const url = "ofertas/criar-oferta"
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
                error: () => {
                    setLoading(false)
                    return <b>Erro ao Cadastrar Oferta</b>
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
                                <label className="required-field-label" >Tipo</label>
                                <select name="tipo" defaultValue={""} required >
                                    <option value="" disabled>Selecionar</option>
                                    <option value="Produto">Produto</option>
                                    <option value="Serviço">Serviço</option>
                                </select>
                            </div>
                            <div className="form-group f1">
                                <label className="required-field-label" name="">Status</label>
                                <select name="status" defaultValue={""} required>
                                    <option value="" disabled >Selecionar</option>
                                    <option value={true}>Disponível</option>
                                    <option value={false}>Indisponível</option>
                                </select>
                            </div>
                            <div className="form-group f1">
                                <label className="required-field-label">Categorias</label>
                                <select id="planoAssociado" defaultValue={""} name="categoriaId">
                                    <option value="" disabled>
                                        Selecione
                                    </option>
                                    <CategoriesOptions />
                                </select>
                            </div>
                        </div>

                        <div className="form-group f4 desc">
                            <label className="required-field-label">Descrição</label>
                            <textarea maxLength="150" type="text" rows={9} name="descricao" required />
                        </div>
                    </div>
                </div>
                <div className="containerRow">
                    <div className="form-group">
                        <label htmlFor="img_path" className="inputLabel">
                            <BiSolidImageAdd /> Selecione uma imagem
                            <input type="file" required accept="image/*" className="custom-file-input" id="img_path" name="imagens" onChange={(e) => imageReferenceHandler(e, setImageReference)} />
                        </label>
                    </div>
                    <div className="form-group"></div>
                    <div className="form-group"></div>
                </div>

                <div className="containerRow">
                    <div className="form-group f2">
                        <label className="required-field-label">Quantidade</label>
                        <input type="number" className="form-control" id="nomeContato" name="quantidade" required />
                    </div>
                    <div className="form-group f2">
                        <label>Valor</label>
                        <RealInput name="valor" reference={reference} required />
                    </div>
                    <div className="form-group f2">
                        <label className="required-field-label">Limite de Compra</label>
                        <input type="number" className="form-control" name="limiteCompra" required />
                    </div>
                </div>
                <div className="containerRow">
                    <div className="form-group f2">
                        <label className="required-field-label">Vencimento</label>
                        <input type="datetime-local" className="form-control" name="vencimento" required />
                    </div>
                    <div className="form-group f2">
                        <label>Cidade</label>
                        <input type="text" className="form-control" name="cidade" />
                    </div>
                    <div className="form-group f1">
                        <label>Estado</label>
                        <input type="text" className="form-control" name="estado" />
                    </div>
                    <div className="form-group f2">
                        <label className="required-field-label">Retirada</label>
                        <select id="planoAssociado" defaultValue={""} name="retirada" required>
                            <option value="" disabled>
                                Selecione
                            </option>
                            <option value="Local">
                                Local
                            </option>
                            <option value="Entrega" >
                                Entrega
                            </option>
                        </select>
                    </div>
                </div>
                <div className="form-group desc">
                    <label>Observações</label>
                    <textarea name="obs" rows={9} />
                </div>
                {/* INVISIBLE INPUT */}
                <input readOnly style={{ display: "none" }} type="text" name="usuarioId" value={getId()} />
                <input readOnly style={{ display: "none" }} type="text" name="nomeUsuario" value={getName()} />

                <div className="buttonContainer">
                    <ButtonMotion onClick={handleclick} type="button">Voltar</ButtonMotion>
                    <ButtonMotion className="purpleBtn" type="submit" disabled={loading}>Cadastrar</ButtonMotion>
                </div>
            </form>
            <Footer />
        </div>)
};

export default OfertasCadastrar;
