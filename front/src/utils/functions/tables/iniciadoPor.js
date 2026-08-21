// Quem de fato clicou pra fazer a transação (usuarioIniciadorId) — prefere o
// código curto (ex: "0000004-01"), cai pro nome se não tiver código (Matriz,
// ou usuário anterior ao backfill).
export const iniciadoPorLabel = (transacao) =>
    transacao?.usuarioIniciador?.codigoOperador ?? transacao?.usuarioIniciador?.nome ?? '-'
