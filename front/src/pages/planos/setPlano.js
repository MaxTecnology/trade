// type: 'agencia' | 'associado' | 'gerente'
export const setPlano = (data, type) => {
    if (!Array.isArray(data)) return []
    return data.filter(p => p.tipoPlano === type?.toLowerCase() && p.ativo !== false)
}
