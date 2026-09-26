// Quem de fato clicou pra fazer a transação (usuarioIniciadorId) — mostra o
// nome da pessoa (mais legível que um código cru) e, quando existe
// codigoOperador (usuário de Associado/Agência — uma conta pode ter vários
// usuários, então só o nome da empresa não bastaria pra rastrear QUEM
// clicou), o código entra entre parênteses pra manter a rastreabilidade.
// Matriz não tem codigoOperador (só existe um admin, não precisa codificar)
// — mostra só o nome nesse caso (achado do usuário, 2026-09-26).
export const iniciadoPorLabel = (transacao) => {
    const usuario = transacao?.usuarioIniciador
    if (!usuario) return '-'
    if (usuario.nome && usuario.codigoOperador) return `${usuario.nome} (${usuario.codigoOperador})`
    return usuario.nome ?? usuario.codigoOperador ?? '-'
}
