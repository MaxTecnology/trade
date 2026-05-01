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
  if (state.user.tipo) {
    return state.user.conta.tipoDaConta.descricao;
  }
}
