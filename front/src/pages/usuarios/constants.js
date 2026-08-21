const ROLE_LABEL = {
    associate_admin: 'Administrador Associado',
    associate_operator: 'Operador Associado',
    agency_admin: 'Administrador de Agência',
    agency_operator: 'Operador de Agência',
}

// Filtro de texto — substring, case-insensitive.
const filterIncludes = (row, columnId, filterValue) => {
    if (!filterValue) return true
    const cellValue = row.getValue(columnId)
    return String(cellValue ?? '').toLowerCase().includes(String(filterValue).toLowerCase())
}

// Filtro exato — pros selects de Perfil/Status de SearchUsuarios.jsx.
const filterEquals = (row, columnId, filterValue) => {
    if (!filterValue) return true
    return String(row.getValue(columnId)) === String(filterValue)
}

// Colunas de Usuario (sub-conta) — id/nome/email/role/ativo/criadoEm, não
// tem conta/nomeFantasia/nomeFranquia (isso é de Associado/Agência).
export const columns = [
    {
        accessorKey: 'codigoOperador',
        header: 'Código',
        cell: (info) => info.getValue() ?? '-',
    },
    {
        accessorKey: 'nome',
        header: 'Nome',
        filterFn: filterIncludes,
    },
    {
        accessorKey: 'email',
        header: 'E-mail',
        filterFn: filterIncludes,
    },
    {
        accessorKey: 'role',
        header: 'Perfil',
        cell: (info) => ROLE_LABEL[info.getValue()] ?? info.getValue(),
        filterFn: filterEquals,
    },
    {
        accessorKey: 'ativo',
        header: 'Status',
        cell: (info) => info.getValue() ? 'Ativo' : 'Inativo',
        filterFn: filterEquals,
    },
]