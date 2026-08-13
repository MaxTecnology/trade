export const columns = [
    {
        id: 'account',
        accessorKey: 'conta.numero',
        header: 'Conta',
    },
    {
        accessorKey: 'nomeFantasia',
        header: 'Nome Fantasia',
    },
    {
        id: 'unidade',
        accessorFn: (row) => row.agencia?.nome ?? 'Matriz',
        header: 'Unidade',
    },
    {
        accessorKey: 'email',
        header: 'E-mail',
    },
    {
        accessorKey: 'status',
        header: 'Status',
    },
    {
        accessorKey: 'estado',
        header: 'Estado',
    },
    {
        accessorKey: 'cidade',
        header: 'Cidade',
    },
    {
        id: 'categoriaId',
        accessorKey: 'categoriaId',
        header: 'Categoria',
    },
    {
        id: 'agencia',
        accessorKey: 'conta.nomeFranquia',
        header: 'Agência',
    }
]
