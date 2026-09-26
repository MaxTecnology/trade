import { proxy } from "valtio";


const filters = proxy({
    table: {},
    cards: {},
    // Namespace independente pro filtro de gerentes na tela "Comissões" —
    // "table" já é escrito pelo filtro de comissão da plataforma na MESMA
    // tela; sem um namespace próprio, os dois campos "Pesquisar" colidiriam
    // no mesmo objeto global (decisão de produto 2026-09-25).
    gerente: {},
});


export default filters;
