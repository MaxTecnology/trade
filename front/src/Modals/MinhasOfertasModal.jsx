import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Mascaras from '@/hooks/Mascaras';
import { editItem, } from '@/hooks/ListasHook';
import { closeModal } from '@/hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { BiSolidImageAdd } from 'react-icons/bi';
import RealInput from '@/components/Inputs/CampoMoeda';
import { getId } from '@/hooks/getId';
import defaultImage from '@/assets/images/default_img.png'
import CategoriesOptions from '@/components/Options/CategoriesOptions';
import { toast } from 'sonner';
import useRevalidate from '@/hooks/ReactQuery/useRevalidate';

const MinhasOfertasModal = ({ isOpen, modalToggle, setState, ofertaInfo }) => {
    const [imagemReference, setImageReference] = useState(null);
    const [reference, setReference] = useState(true)
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const info = ofertaInfo
    var urlOferta = `ofertas/atualizar-oferta/${info.idOferta}`

    const revalidate = useRevalidate();

    useEffect(() => {
        Mascaras()
        if (info && info.imagens) {
            setImageReference(info.imagens[0])
        } else {
            setImageReference("https://cdn.vectorstock.com/i/preview-1x/65/30/default-image-icon-missing-picture-page-vector-40546530.jpg")
        }
    }, [info]);

    const handleImagemChange = (event) => {
        const arquivo = event.target.files[0]
        if (arquivo) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageReference(e.target.result)
            };
            reader.readAsDataURL(arquivo);
        }
    };
    function formatarDataParaInputData(dataISO8601) {
        // Criar objeto Date a partir da string ISO 8601
        const dataObj = new Date(dataISO8601);

        // Extrair partes da data
        const ano = dataObj.getFullYear();
        const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0'); // Mês é base 0, então adicionamos 1
        const dia = dataObj.getDate().toString().padStart(2, '0');
        const hora = dataObj.getHours().toString().padStart(2, '0');
        const minuto = dataObj.getMinutes().toString().padStart(2, '0');

        // Criar string no formato datetime-local
        const datetimeLocalString = `${ano}-${mes}-${dia}T${hora}:${minuto}`;

        return datetimeLocalString;
    }

    const formHandler = (event) => {
        event.preventDefault()
        setReference(false);
        setTimeout(() => {
            toast.promise(editItem(event, urlOferta, setState, "ofertas"), {
                loading: 'Editando Oferta...',
                success: () => {
                    setReference(true)
                    modalToggle()
                    revalidate("ofertas")
                    return "Oferta editada com sucesso!"
                },
                error: (error) => {
                    setReference(true)
                    return <b>Erro: {error.message}</b>
                },
            })
        }, 200)
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Editar Associado"
            className="modalContainer modalAnimationUser"
            overlayClassName="modalOverlay modalAnimationUserOverlay"
        >
            <div className='modalEditHeader'>
                <p>Editar Oferta</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <form onSubmit={(event) => { formHandler(event) }} className="containerForm ofertasContainer">
                <div className="ofertasTop">
                    <div className="ofertasImageContainer">
                        <img src={imagemReference ? imagemReference : defaultImage} className="rounded float-left img-fluid" alt="..." id="imagem-selecionada" name="imagem-selecionada" />
                    </div>
                    <div className="ofertasRightside">
                        <div className="containerRow">
                            <div className="form-group f1">
                                <label className="required">Titulo</label>
                                <input defaultValue={info.titulo} type="text" className="form-control" id="razaoSocial" name="titulo" required />
                            </div>
                            <div className="form-group f1">
                                <label className="required" >Tipo</label>
                                <select name="tipo" defaultValue={info.tipo} required >
                                    <option value="" disabled>Selecionar</option>
                                    <option value="Produto">Produto</option>
                                    <option value="Serviço">Serviço</option>
                                </select>
                            </div>
                            <div className="form-group f1">
                                <label className="required" name="">Status</label>
                                <select name="status" defaultValue={info.status} required>
                                    <option value="" disabled >Selecionar</option>
                                    <option value="true">Disponível</option>
                                    <option value="false">Indisponível</option>
                                </select>
                            </div>
                            <div className="form-group f1">
                                <label className="required">Categorias</label>
                                <select id="planoAssociado" defaultValue={info.categoria} name="categoria">
                                    <option value="" disabled>
                                        Selecione
                                    </option>
                                    <CategoriesOptions />
                                </select>
                            </div>
                        </div>

                        <div className="form-group f4 desc">
                            <label className="required">Descrição</label>
                            <textarea defaultValue={info.descricao} maxLength="150" type="text" rows={9} name="descricao" required />
                        </div>
                    </div>
                </div>
                <div className="containerRow">
                    <div className="form-group">
                        <label htmlFor="img_path" className="inputLabel">
                            <BiSolidImageAdd /> Selecione uma imagem
                            <input type="file" accept="image/*" id="img_path" className="custom-file-input" name='imagem' onChange={handleImagemChange} />
                        </label>
                    </div>
                    <div className="form-group"></div>
                    <div className="form-group"></div>
                </div>

                <div className="containerRow">
                    <div className="form-group f2">
                        <label className="required">Quantidade</label>
                        <input defaultValue={info.quantidade} type="number" className="form-control" id="nomeContato" name="quantidade" required />
                    </div>
                    <div className="form-group f2">
                        <label className='required'>Valor</label>
                        <RealInput name="valor" defaultValue={info.valor} reference={reference} required />
                    </div>
                    <div className="form-group f2">
                        <label className="required">Limite de Compra</label>
                        <input type="number" defaultValue={info.limiteCompra} className="form-control" name="limiteCompra" required />
                    </div>
                </div>
                <div className="containerRow">
                    <div className="form-group f2">
                        <label className="required">Vencimento</label>
                        <input type="datetime-local" defaultValue={formatarDataParaInputData(info.vencimento)} className="form-control" name="vencimento" required />
                    </div>
                    <div className="form-group f2">
                        <label>Cidade</label>
                        <input type="text" defaultValue={info.cidade} className="form-control" name="cidade" />
                    </div>
                    <div className="form-group f2">
                        <label className="required">Retirada</label>
                        <select id="planoAssociado" defaultValue={info.retirada} name="retirada">
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
                    <textarea defaultValue={info.obs} name="obs" rows={9} />
                </div>
                <input readOnly style={{ display: "none" }} type="text" name="usuarioId" value={getId()} />
                <div className="buttonContainer">
                    <button onClick={() => closeModal(modalToggle, setSucess, setError)} className="purpleBtn" type="button">Fechar</button>
                    <button type="submit">Editar</button>
                </div>
            </form>
        </Modal>
    );
};

export default MinhasOfertasModal;
