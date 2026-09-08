import { useQueryOfertas, useQueryMinhaLoja } from "@/hooks/ReactQuery/useQueryOfertas";
import { motion } from "framer-motion";
import { time } from "./constant";
import { isMatriz, isAgencia } from "@/hooks/getId";
import state from "@/store";

// GET /ofertas (marketplace) exclui a própria oferta do requisitante — certo
// pra tela de marketplace, errado pra "Unidade"/"Geral" aqui, que precisam
// da lista completa. "Unidade" segue a mesma regra hierárquica do card
// Associados: minha própria oferta + ofertas de quem está no meu grupo
// (Matriz: associados sem agência; Agência: seus próprios associados;
// Associado: colegas da mesma agência, ou colegas diretos da Matriz se eu
// também não tenho agência).
const pertenceAoMeuGrupo = (oferta) => {
    const conta = oferta.conta
    if (!conta) return false

    if (isMatriz()) {
        return conta.entityType === 'associado' && !conta.associado?.agenciaId
    }
    if (isAgencia()) {
        const minhaAgenciaId = state.user?.entityId
        return conta.entityType === 'associado' && conta.associado?.agenciaId === minhaAgenciaId
    }
    // Associado (comum ou gerente)
    const minhaAgenciaId = state.user?.agenciaId
    if (minhaAgenciaId) {
        return conta.entityType === 'associado' && conta.associado?.agenciaId === minhaAgenciaId
    }
    return conta.entityType === 'associado' && !conta.associado?.agenciaId
}

const OfertasCard_Dashboard = () => {
    const { data: outrasResp } = useQueryOfertas()
    const { data: minhaLojaResp } = useQueryMinhaLoja()

    const outras = outrasResp?.data ?? []
    const minhasAbertas = (minhaLojaResp?.data ?? []).filter((o) => o.status === 'aberta')

    const geral = [...outras, ...minhasAbertas]
    const unidade = [...minhasAbertas, ...outras.filter(pertenceAoMeuGrupo)]

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, translate: 0 }}
            transition={{ duration: 0.7, delay: time * 0.2 }}
            exit={{ opacity: 0, scale: 0 }}
            className="homeCard"
        >
            <div className="homeCardItem">
                <h3 className="homeCardItemHeader">Ofertas</h3>
                <div className="homeCardItemBody">
                    <div>
                        <p>Unidade</p>
                        <p>{unidade.length}</p>
                    </div>
                    <div>
                        <p>Geral</p>
                        <p>{geral.length}</p>
                    </div>
                </div>
            </div>
            <div className="homeCardBar" />
        </motion.div>
    )
};

export default OfertasCard_Dashboard;
