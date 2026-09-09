const STATUS_LABEL = { ativa: 'Ativa', pausada: 'Pausada', fechada: 'Fechada' }

export const columns = [
    {
        accessorKey: 'titulo',
        header: 'Titulo',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => STATUS_LABEL[info.getValue()] ?? info.getValue(),
    },
    {
        accessorKey: 'valorRT',
        header: 'Valor',
    },
    {
        accessorKey: 'quantidadeDisponivel',
        header: 'Quantidade',
    },
    {
        accessorKey: 'tipoAtendimento',
        header: 'Tipo',
        cell: (value) => value.getValue()?.join(', ') || 'Indefinido',
    },
    {
        accessorKey: 'vencimento',
        header: 'Vencimento',
    },
    {
        id: 'categoria',
        accessorKey: 'categoria.nome',
        header: 'Categoria',
    },
    {
        accessorKey: 'cidade',
        header: 'Cidade',
    },
]
