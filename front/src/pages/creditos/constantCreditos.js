const STATUS_LABEL = {
    em_analise: 'Em análise',
    encaminhado: 'Encaminhado',
    aprovado: 'Aprovado',
    negado: 'Negado',
}

export const columns = [
    {
        id: 'conta',
        accessorFn: (row) => row.associado?.conta?.numero ?? row.agencia?.conta?.numero,
        header: 'N° da conta',
        cell: (info) => info.getValue() ?? '-',
    },
    {
        id: 'solicitante',
        accessorFn: (row) => row.associado?.nome ?? row.agencia?.nome,
        header: 'Solicitante',
    },
    {
        accessorKey: 'valorSolicitado',
        header: 'Aumento de Limite',
    },
    {
        id: 'agencia',
        accessorFn: (row) => row.associado?.agencia?.nome ?? row.agencia?.nome ?? 'Matriz',
        header: 'Agência',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => STATUS_LABEL[info.getValue()] ?? info.getValue(),
    },
]
