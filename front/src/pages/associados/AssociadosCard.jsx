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
    if (!texto) return '';
    if (texto.length > comprimentoMaximo) {
        texto = texto.slice(0, comprimentoMaximo - 3) + "...";
    }
    return texto;
}

const AssociadosCard = ({ associado, index }) => {
    const { data: categorias } = useQueryCategorias()
    const navigate = useNavigate();
    const data = associado

    const associadoCategoria = (Array.isArray(categorias) ? categorias : [])
        .find(c => c.id === data.categoriaId)?.nome ?? "Sem Categoria"

    useEffect(() => {
        activePage("associados")
    }, []);
    const handleNavigation = () => {
        state.userCard = data
        localStorage.setItem('userCard', JSON.stringify(data));
        navigate("/associadoInfo")
    }

    const handleWhats = () => {
        const celular = data.contatos?.[0]?.celular || data.telefone;

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
        const site = data.contatos?.[0]?.site
        if (site) window.open(site, '_blank')
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, translate: 0 }}
            transition={{ duration: 0.3, delay: index * 0.3 }}
            className="associadoCard"
        >
            <img src={data.imagemUrl ? data.imagemUrl : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="" className="associadoCardImagem" />
            <div className="associadoCardTag">
                <div >
                    <BsTagsFill />
                    {associadoCategoria}
                </div>
                <div >
                    {data.estado || 'N/A'}
                    <img src={logoBrazil} alt="" />
                </div>
            </div>
            <div className="associadoCardName flex justify-between items-center gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="truncate min-w-0 flex-1 block">{data.nomeFantasia}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{data.nomeFantasia}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div className="shrink-0">
                    <StarRating rating={data.reputacao} />
                </div>
            </div>

            <div className={data.status === 'ativo' ? "associadoCardStatus" : "associadoCardStatus disabled"}>
                {data.status === 'ativo' ? "Atendendo" : "Não atendendo"}
            </div>
            <div className="associadoCardDesc">
                {data.descricao}
            </div>
            <div className="associadoCardIconsContainer">
                <div>
                    <BsGlobe />
                    <span>{data.agencia?.nome || data.nomeFantasia || ''}</span>
                </div>
                <div className="flex2">
                    <BsUniversalAccessCircle />
                    <span>{data.gerente?.nome || data.agencia?.nome || data.nomeFantasia || ''}</span>
                </div>
                <div className="whats" onClick={data.contatos?.[0]?.celular ? handleWhats : null}>
                    <BsWhatsapp />
                    <span>Contato</span>
                </div>
                <div onClick={websiteHandler} className={data.contatos?.[0]?.site ? "website" : ""}>
                    <BsBrowserChrome />
                    <span>Site</span>
                </div>
            </div>
            <div className="buttonContainer">
                <ButtonMotion onClick={handleNavigation}>Ver +</ButtonMotion>
            </div>
        </motion.div>
    )
};

export default AssociadosCard;
