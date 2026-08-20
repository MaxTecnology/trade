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
        accessorKey: 'associado.agencia.nome',
        header: 'Agência',
        cell: (info) => info.getValue() ?? '-',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => STATUS_LABEL[info.getValue()] ?? info.getValue(),
    },
]
