const STATUS_LABEL = {
    pendente: 'Pendente',
    concluida: 'Concluída',
    estornada: 'Estornada',
    falha: 'Falha',
}

const ESTORNO_LABEL = {
    em_analise: 'Estorno em análise',
    encaminhado: 'Estorno encaminhado',
    negado: 'Estorno negado',
}

// transacao.status só vira 'estornada' quando a Matriz aprova de fato — enquanto
// isso, uma solicitação em_analise/encaminhado/negado não aparece em lugar nenhum,
// e a transação continua parecendo "concluída" sem explicação.
const renderStatusTransacao = (t) => {
    if (!t) return null
    const label = STATUS_LABEL[t.status] ?? t.status
    const estorno = t.solicitacoesEstorno?.[0]
    const estornoLabel = estorno ? ESTORNO_LABEL[estorno.status] : null

    if (!estornoLabel) return <span>{label}</span>

    return (
        <span className="statusTransacaoWrap">
            <span>{label}</span>
            <span className="badgeEstornoPendente">{estornoLabel}</span>
        </span>
    )
}

// Pra tabelas cujas linhas SÃO a Transacao (Transações Minhas/Extratos).
export const StatusTransacaoCell = ({ row }) => renderStatusTransacao(row.original)

// Pra tabelas cujas linhas são MovimentacaoConta, com a Transacao aninhada
// em `transacao` (Meu Extrato).
export const StatusTransacaoRelationCell = ({ row }) => renderStatusTransacao(row.original.transacao)
