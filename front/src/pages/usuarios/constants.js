const ROLE_LABEL = {
    associate_admin: 'Administrador Associado',
    associate_operator: 'Operador Associado',
    agency_admin: 'Administrador de Agência',
    agency_operator: 'Operador de Agência',
}

// Colunas de Usuario (sub-conta) — id/nome/email/role/ativo/criadoEm, não
// tem conta/nomeFantasia/nomeFranquia (isso é de Associado/Agência).
export const columns = [
    {
        accessorKey: 'nome',
        header: 'Nome',
    },
    {
        accessorKey: 'email',
        header: 'E-mail',
    },
    {
        accessorKey: 'role',
        header: 'Perfil',
        cell: (info) => ROLE_LABEL[info.getValue()] ?? info.getValue(),
    },
    {
        accessorKey: 'ativo',
        header: 'Status',
        cell: (info) => info.getValue() ? 'Ativo' : 'Inativo',
    },
]


export const options = [
    { value: 'Leitura', label: 'Leitura', color: '#22c55e' },
    { value: 'Escrita', label: 'Escrita', color: '#0ea5e9' },
    { value: 'Exclusão', label: 'Exclusão', color: '#ef4444' }
]
export const vendas = [
    { value: 'Leitura', label: 'Leitura', color: '#22c55e' },
    { value: 'Escrita', label: 'Escrita', color: '#0ea5e9' },
    { value: 'Cancelamento', label: 'Cancelamento', color: '#ef4444' }
]
export const voucher = [
    { value: 'Leitura', label: 'Leitura', color: '#22c55e' },
    { value: 'Solicitação', label: 'Solicitação', color: '#facc15' },
    { value: 'Aprovar', label: 'Aprovar', color: '#0ea5e9' },
    { value: 'Recusar', label: 'Recusar', color: '#ef4444' },
]
export const leitura = [
    { value: 'Leitura', label: 'Leitura', color: '#22c55e', }
]
export const extrato = [
    { value: 'Leitura', label: 'Leitura', color: '#22c55e' },
    { value: 'Solicitação de Extorno', label: 'Solicitação de Extorno', color: '#facc15' },

]