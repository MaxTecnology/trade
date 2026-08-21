import state from "../store";

export function getId() {
  if (state.user) {
    return state.user.idUsuario;
  }
}

export function getName() {
  if (state.user.nomeFantasia) {
    return state.user.nomeFantasia;
  }
}

export function getType() {
  return state.user?.conta?.tipoDaConta?.descricao ?? state.user?.tipoDaConta?.descricao ?? ''
}

// getType() compara contra uma string de exibição (ROLE_DISPLAY, em
// authFunction.js) que nunca bate com "Associado"/"Agência" puro pra
// associate_admin/operator ou agency_admin/operator — só "Matriz" (superadmin)
// batia por coincidência. Esses helpers comparam direto contra entityType/role,
// que vêm da API sem intermediário — não quebram se o texto de exibição mudar.
export function isMatriz() {
  return state.user?.entityType === 'matriz'
}

export function isAgencia() {
  return state.user?.entityType === 'agencia'
}

export function isAssociado() {
  return state.user?.entityType === 'associado'
}

export function isGerente() {
  return state.user?.role === 'gerente'
}

// Mesma checagem do adminGuard do backend (GET/POST /usuarios) — só
// associate_admin/agency_admin gerenciam sub-contas. Operador e gerente não.
export function isAdminEntidade() {
  return state.user?.role === 'associate_admin' || state.user?.role === 'agency_admin'
}
