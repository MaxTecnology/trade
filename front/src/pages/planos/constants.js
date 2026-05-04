const formatDate = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleDateString('pt-BR')
}

const formatRT = (value) => {
    if (value == null) return '-'
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const columns = [
    { accessorKey: 'criadoEm', header: 'Data', cell: ({ getValue }) => formatDate(getValue()) },
    { accessorKey: 'nome', header: 'Nome do Plano' },
    { accessorKey: 'percentualComissao', header: 'Comissão %' },
]

export const columnsAssociado = [
    { accessorKey: 'criadoEm', header: 'Data', cell: ({ getValue }) => formatDate(getValue()) },
    { accessorKey: 'nome', header: 'Nome do Plano' },
    { accessorKey: 'percentualComissao', header: 'Comissão %' },
    { accessorKey: 'taxaInscricaoRT', header: 'Inscrição (RT$)', cell: ({ getValue }) => formatRT(getValue()) },
    { accessorKey: 'taxaManutencaoAnualRT', header: 'Manutenção Anual (RT$)', cell: ({ getValue }) => formatRT(getValue()) },
]
