export const columns = [
    {
        accessorKey: 'titulo',
        header: 'Titulo',
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
