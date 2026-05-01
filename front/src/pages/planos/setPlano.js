export const setPlano = (apiData, type) => {
    if (apiData && apiData.planos) {
        var plano = []
        apiData.planos.map((planos) => {
            if (planos.tipoDoPlano === type) {
                plano.push(planos)
            }
        })
        return plano
    }
    return []
}