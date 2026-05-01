import state from "../store";

export function popup(mensagem, titulo) {
    state.message = mensagem
    if (titulo) {
        state.titulo = titulo
        // console.log(titulo)
    }
    // if (função) {
    //     função()
    // }
}