// comprador/vendedor (FK direta pra Associado) só existem quando essa ponta
// da transação é um Associado — Agência/Matriz participando direto (via
// Oferta ou negociação) deixam esses campos null. Nesses casos o nome vem
// de contaOrigem/contaDestino (comprador = origem, vendedor = destino, ver
// permuta()/negociada() em transaction.service.ts).
//
// `associado` entra como fallback pro caso da conta em si ser de um
// Associado mas a FK (comprador/vendedorId) ter ficado null — acontece em
// crédito da Matriz (credito() nunca preenche comprador/vendedorId) e no
// estorno dele (achado do usuário, 2026-09-26).
const nomeConta = (conta) => {
    if (!conta) return null;
    if (conta.entityType === 'matriz') return 'Matriz';
    if (conta.entityType === 'associado') return conta.associado?.nome ?? null;
    return conta.agencia?.nome ?? null;
};

// Numa transação `estorno`, contaOrigem/contaDestino saem TROCADAS em
// relação à original (ver estorno()/estornarCredito() em
// transaction.service.ts: contaOrigemId = original.contaDestinoId,
// contaDestinoId = original.contaOrigemId — quem recebeu vira quem debita).
// Sem essa troca aqui, o fallback (só entra quando comprador/vendedorId FK
// é null) atribuía o papel errado nas linhas de estorno: chegou a mostrar o
// próprio vendedor original também como "Comprador" na reversão.
export const compradorLabel = (transacao) =>
    transacao?.comprador?.nome ??
    nomeConta(transacao?.tipo === 'estorno' ? transacao?.contaDestino : transacao?.contaOrigem) ??
    '-';

export const vendedorLabel = (transacao) =>
    transacao?.vendedor?.nome ??
    nomeConta(transacao?.tipo === 'estorno' ? transacao?.contaOrigem : transacao?.contaDestino) ??
    '-';
