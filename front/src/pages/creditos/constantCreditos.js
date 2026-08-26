const STATUS_LABEL = {
    em_analise: 'Em análise',
    encaminhado: 'Encaminhado',
    aprovado: 'Aprovado',
    negado: 'Negado',
}

export const columns = [
    {
        accessorKey: 'associado.conta.numero',
        header: 'N° da conta',
        cell: (info) => info.getValue() ?? '-',
    },
    {
        accessorKey: 'associado.nome',
        header: 'Associado',
    },
    {
        accessorKey: 'valorSolicitado',
        header: 'RT$',
    },
    {
        id: 'agencia',
        accessorFn: (row) => row.associado?.agencia?.nome ?? 'Matriz',
        header: 'Agência',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => STATUS_LABEL[info.getValue()] ?? info.getValue(),
    },
]
