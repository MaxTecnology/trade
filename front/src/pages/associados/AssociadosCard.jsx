import { useEffect } from "react";
import { BsGlobe, BsUniversalAccessCircle, BsWhatsapp, BsBrowserChrome, BsTagsFill } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';
import state from "@/store";
import logoBrazil from "@/assets/images/flagofBrazil.png"
import { activePage } from "@/utils/functions/setActivePage";
import StarRating from "@/components/Stars/StarRating";
import ButtonMotion from "@/components/FramerMotion/ButtonMotion";
import { motion } from "framer-motion";
import { useQueryCategorias } from "@/hooks/ReactQuery/useQueryCategorias";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

function truncarTexto(texto, comprimentoMaximo) {
    if (texto.length > comprimentoMaximo) {
        texto = texto.slice(0, comprimentoMaximo - 3) + "...";
    }
    return texto;
}

const AssociadosCard = ({ associado, index }) => {
    const { data: categorias } = useQueryCategorias()
    const navigate = useNavigate();
    const data = associado

    const associadoCategoria = categorias && categorias.categorias ? categorias.categorias.find(categoria => categoria.idCategoria === data.categoriaId)?.nomeCategoria || "Sem Categoria" : "Sem Categoria"

    useEffect(() => {
        activePage("associados")
    }, []);
    const handleNavigation = () => {
        state.userCard = data
        localStorage.setItem('userCard', JSON.stringify(data));
        navigate("/associadoInfo")
    }

    const handleWhats = () => {
        const celular = data?.conta?.gerenteConta?.telefone || data.celular;

        // Verifica se o dispositivo é móvel
        const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        let url;
        if (isMobile) {
            // URL para abrir o aplicativo do WhatsApp
            url = `whatsapp://send?phone=${celular}`;
        } else {
            // URL para abrir o WhatsApp Web
            url = `https://web.whatsapp.com/send?phone=${celular}`;
        }

        // Abre uma nova aba ou janela com a URL do WhatsApp
        window.open(url, '_blank');
    };

    const websiteHandler = () => {
        if (data.site) {
            window.open(data.site, '_blank');  // Abre o site em uma nova aba
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, translate: 0 }}
            transition={{ duration: 0.3, delay: index * 0.3 }}
            className="associadoCard"
        >
            <img src={data.imagem ? data.imagem : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" className="associadoCardImagem" />
            <div className="associadoCardTag">
                <div >
                    <BsTagsFill />
                    {associadoCategoria}
                </div>
                <div >
                    SC
                    <img src={logoBrazil} alt="" />
                </div>
            </div>
            <div className="associadoCardName flex justify-between">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>{truncarTexto(data.nomeFantasia, 25)}</TooltipTrigger>
                        <TooltipContent>
                            <p>{data.nomeFantasia}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <StarRating rating={data.reputacao} />
            </div>

            <div className={data.status ? "associadoCardStatus" : "associadoCardStatus disabled"}>
                {data.status ? "Atendendo" : "Não atendendo"}
            </div>
            <div className="associadoCardDesc">
                {data.descricao}
            </div>
            <div className="associadoCardIconsContainer">
                <div>
                    <BsGlobe />
                    {truncarTexto(data.conta.nomeFranquia, 10) || truncarTexto(data.nomeFantasia, 10)}
                </div>
                <div className="flex2">
                    <BsUniversalAccessCircle />
                    {truncarTexto(data?.conta?.gerenteConta?.nomeFranquia || data?.conta?.nomeFranquia || data?.nomeFantasia, 25)}
                </div>
                <div className="whats" onClick={data.celular ? handleWhats : null}>
                    <BsWhatsapp />
                    Contato
                </div>
                <div onClick={websiteHandler} className={data.site ? "website" : ""}>
                    <BsBrowserChrome />
                    Site
                </div>
            </div>
            <div className="buttonContainer">
                <ButtonMotion onClick={handleNavigation}>Ver +</ButtonMotion>
            </div>
        </motion.div>
    )
};

export default AssociadosCard;
