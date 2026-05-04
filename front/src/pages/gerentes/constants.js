const formatDate = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleDateString('pt-BR')
}

export const columns = [
    { accessorKey: 'nome', header: 'Nome' },
    { accessorKey: 'email', header: 'E-mail' },
    {
        id: 'agencia',
        header: 'Agência',
        accessorFn: (row) => row.associado?.agencia?.nome ?? '-',
    },
    {
        id: 'plano',
        header: 'Plano',
        accessorFn: (row) => row.associado?.plano?.nome ?? '-',
    },
    {
        id: 'comissao',
        header: 'Comissão %',
        accessorFn: (row) => row.associado?.plano?.percentualComissao ?? '-',
    },
    {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => (row.ativo ? 'Ativo' : 'Inativo'),
    },
    { accessorKey: 'criadoEm', header: 'Data', cell: ({ getValue }) => formatDate(getValue()) },
]
