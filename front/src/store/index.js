import { proxy } from "valtio";


const state = proxy({
    // url: "http://localhost:3000/",
    url: "https://api.redetrade.com.br/",
    logged: false,
    titulo: "Operação Concluida!",
    arquivo: "",
    // message: "Usuário deletado com sucesso!"
});


export default state;
