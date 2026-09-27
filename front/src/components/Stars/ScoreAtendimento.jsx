import StarRating from "./StarRating";

// `total === 0` é "nunca avaliado" (neutro) — nada a ver com nota baixa.
// Estrelas vazias sozinhas (StarRating sem esse wrapper) pareciam "nota
// 0/5" quando na real não existia avaliação nenhuma ainda (achado do
// usuário, 2026-09-26 — reputacao nunca foi implementada de verdade no
// backend até agora).
const ScoreAtendimento = ({ media, total, showCount = false }) => {
    if (!total) {
        return <span className="text-gray-400 text-sm">Sem avaliações</span>;
    }
    return (
        <div className="flex items-center gap-2">
            <StarRating rating={media} />
            {showCount && <span className="text-gray-500 text-sm">({total})</span>}
        </div>
    );
};

export default ScoreAtendimento;
