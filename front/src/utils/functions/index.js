export function truncarTexto(texto, comprimentoMaximo) {
    if (texto.length > comprimentoMaximo) {
        texto = texto.slice(0, comprimentoMaximo - 3) + "...";
    }
    return texto;
}