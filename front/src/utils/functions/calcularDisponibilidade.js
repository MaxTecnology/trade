import state from "@/store";

export function calcularDisponibilidade(usuarioVendedor) {
    // Calcula o saldo disponível do usuário comprador
    const saldoDisponivelComprador = state.user.conta.limiteCredito + state.user.conta.saldoPermuta;
    console.log("DISPONIBILIDADE", saldoDisponivelComprador)
    // Verifica se o usuário vendedor pode vender para o usuário comprador
    const vendaMensalDisponivel = usuarioVendedor.limiteVendaMensal - usuarioVendedor.valorVendaMensalAtual;
    console.log("DISPONIBILIDADE MENSAL", vendaMensalDisponivel)
    // Saldo disponível do usuário vendedor
    let vendaTotalDisponivel = 0

    // Verifica se o usuário vendedor tem limite de venda mensal
    if (vendaMensalDisponivel > 0) {
        let limiteVenda = usuarioVendedor.limiteVendaMensal - usuarioVendedor.valorVendaMensalAtual
        if (limiteVenda > 0 && vendaMensalDisponivel > limiteVenda) {
            vendaTotalDisponivel = vendaMensalDisponivel - limiteVenda
        } else {
            vendaTotalDisponivel = vendaMensalDisponivel
        }
    }
    console.log("DISPONIBILIDADE TOTAL", vendaTotalDisponivel)
    // Calcula o valor disponível para transação
    let limiteTransacao = Math.min(
        saldoDisponivelComprador,
        vendaTotalDisponivel
    );
    console.log("DISPONIBILIDADE TRANSACAO", limiteTransacao)
    return limiteTransacao
}