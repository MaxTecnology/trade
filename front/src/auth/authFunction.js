import state from "../store";
import api from "../services/api";

const ROLE_DISPLAY = {
  superadmin: 'Matriz',
  agency_admin: 'Administrador de Agência',
  agency_operator: 'Operador de Agência',
  gerente: 'Gerente',
  associate_admin: 'Administrador Associado',
  associate_operator: 'Operador Associado',
}

export const getUserInfo = async () => {
  const token = localStorage.getItem('tokenRedeTrade')
  if (!token) return false

  return api.get('auth/me').then((response) => {
    const data = response.data.data
    state.user = {
      ...data,
      idUsuario: data.id,
      nomeFantasia: data.entityName,
      tipo: data.role,
      tipoDaConta: { descricao: ROLE_DISPLAY[data.role] ?? data.role },
      conta: data.conta ? {
        ...data.conta,
        numeroConta: data.conta.numero,
        saldoPermuta: data.conta.saldo,
        limiteCredito: data.conta.limiteCredito,
        tipoDaConta: { descricao: ROLE_DISPLAY[data.role] ?? data.role },
      } : null,
    }
    state.logged = true
    return true
  }).catch((error) => {
    // 401 = token inválido/expirado, silencioso (App.jsx redireciona para login)
    if (error.response?.status !== 401) {
      console.error("Erro ao buscar perfil do usuário:", error)
    }
    localStorage.removeItem('tokenRedeTrade')
    state.logged = false
    return false
  })
}
