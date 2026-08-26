// comprador/vendedor (FK direta pra Associado) só existem quando essa ponta
// da transação é um Associado — Agência/Matriz participando direto (via
// Oferta ou negociação) deixam esses campos null. Nesses casos o nome vem
// de contaOrigem/contaDestino (comprador = origem, vendedor = destino, ver
// permuta()/negociada() em transaction.service.ts).
const nomeConta = (conta) => {
    if (!conta) return null;
    if (conta.entityType === 'matriz') return 'Matriz';
    return conta.agencia?.nome ?? null;
};

export const compradorLabel = (transacao) =>
    transacao?.comprador?.nome ?? nomeConta(transacao?.contaOrigem) ?? '-';

export const vendedorLabel = (transacao) =>
    transacao?.vendedor?.nome ?? nomeConta(transacao?.contaDestino) ?? '-';
