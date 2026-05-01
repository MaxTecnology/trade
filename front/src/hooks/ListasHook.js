import axios from "axios";
import state from "../store";
import { popup } from "./Popup";
import { toast } from "sonner";
import { uploadFile } from "../FirebaseConfig";
import { formHandler } from "../utils/functions/formHandler";
const config = {
    headers: {
        Authorization: `Bearer ${localStorage.getItem('tokenRedeTrade')}`
    }
};

const mainUrl = `${state.url}`
function formatarData(dataString) {
    // Criar um objeto Date com a data fornecida
    const dataOriginal = new Date(dataString);

    // Adicionar informações que estão faltando
    dataOriginal.setUTCHours(23, 59, 59, 999);

    // Formatar a data para o formato ISO 8601
    const dataFormatada = dataOriginal.toISOString();
    return dataFormatada;
}
export const loginUser = (event, setLoading, revalidate) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.target)
    const object = {};
    formData.forEach((value, key) => object[key] = value);
    const call = axios.post(`${mainUrl}usuarios/login`, object)
    toast.promise(call, {
        loading: 'Realizando login...',
        success: (data) => {
            const token = data.data.token
            const user = data.data.user
            localStorage.setItem('tokenRedeTrade', token);
            console.log("USER DATA", data)
            revalidate("login")
            state.logged = true
            state.user = user
            setLoading(false)
            window.location.reload();
            return `${data.data.user.nomeFantasia} seja bem vindo!`;
        },
        error: (err) => {
            setLoading(false)
            console.log(err)
            return "Erro ao realizar login"
        },
    });
}

export const getApiData = async (url, setState) => {
    return axios.get(`${mainUrl}${url}`, config)
        .then((response) => {
            if (setState) {
                setState(response.data)
            }
            return response.data
        })
        .catch((error) => {
            console.log(error)
            return error
        })
}
export const postItem = async (url, body, setData) => {
    return axios.post(`${mainUrl}${url}`, body, config)
        .then((response) => {
            if (setData) {
                setData(response.data)
            }
            return response.data
        })
}

export const getDate = (setData) => {
    // Obter a data atual no formato 'YYYY-MM-DD'
    const hoje = new Date();
    const ano = hoje.getFullYear();
    let mes = hoje.getMonth() + 1;
    mes = mes < 10 ? `0${mes}` : mes;
    let dia = hoje.getDate();
    dia = dia < 10 ? `0${dia}` : dia;

    const dataFormatada = `${dia}/${mes}/${ano}`;
    if (setData) {
        setData(dataFormatada);
        return
    }
    return (dataFormatada);
}

export const requestCredit = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const data = formHandler(formData)
    console.table(data)
    await axios.post(`${mainUrl}${url}`, data, config)
        .then(response => {
            console.log(response)
        })
        .catch(() => {
            throw "Algo de errado aconteceu"
        })
}

// CRÉDITOS HANDLER
export const aproveCreditos = async (id, modalHandler, setState) => {
    const body = {
        "status": "Aprovado"
    }
    toast.promise(axios.put(`${mainUrl}creditos/finalizar-analise/${id}`, body, config), {
        loading: 'Aprovando crédito...',
        success: (data) => {
            modalHandler()
            setState(true)
            return "Credito aprovado com sucesso!"
        },
        error: (err) => {
            console.log(err)
            return "Erro ao aprovar Crédito"
        },
    })
}
export const negateCreditos = async (id, modalHandler, setState) => {
    const body = {
        "status": "Negado"
    }
    toast.promise(axios.put(`${mainUrl}creditos/finalizar-analise/${id}`, body, config), {
        loading: 'Negando crédito...',
        success: (data) => {
            modalHandler()
            setState(true)
            return "Credito negado com sucesso!"
        },
        error: (err) => {
            console.log(err)
            return "Erro ao negar Crédito"
        },
    })
}
export const forwardCreditos = async (id, modalHandler, setState) => {
    const body = {
        "status": "Encaminhado para a matriz",
        "matrizId": 1
    }
    toast.promise(axios.put(`${mainUrl}creditos/encaminhar/${id}`, body, config), {
        loading: 'Encaminhando crédito...',
        success: (data) => {
            modalHandler()
            setState(true)
            return "Credito encaminhado com sucesso!"
        },
        error: (err) => {
            console.log(err)
            return "Erro ao encaminhar Crédito"
        },
    })
}
export const deleteCreditos = async (id, modalHandler, setState) => {
    toast.promise(axios.delete(`${mainUrl}creditos/apagar/${id}`, config), {
        loading: 'Deletando solicitação...',
        success: (data) => {
            modalHandler()
            setState(true)
            return "Solicitação deletada com sucesso!"
        },
        error: (err) => {
            console.log(err)
            return "Erro ao deletar solicitação"
        },
    })
}
export const atualizarCreditos = async (event, id, modalHandler, setState) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const data = formHandler(formData)
    toast.promise(axios.put(`${mainUrl}creditos/editar/${id}`, data, config), {
        loading: 'Editando solicitação...',
        success: (data) => {
            modalHandler()
            setState(true)
            return "Solicitação editada com sucesso!"
        },
        error: (err) => {
            console.log(err)
            return "Erro ao deletar Crédito"
        },
    })
}
export const createItem = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const object = formHandler(formData)

    console.log("OBJETO", object)
    console.log("URL", `${mainUrl}${url}`)
    await axios.post(`${mainUrl}${url}`, object, config)
        .then(response => {
            console.log(response)
        })
        .catch(() => {
            throw "Algo de errado aconteceu"
        })
}

export const createItemWithImage = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    formData.append("usuarioId", state.user.idUsuario)
    formData.append("nomeUsuario", state.user.nomeFantasia)
    const imagem = await uploadFile(formData.get("imagens"))
    formData.set("imagens", imagem)
    const object = formHandler(formData)
    console.log("OBJETO", object)
    console.log("URL", `${mainUrl}${url}`)
    await axios.post(`${mainUrl}${url}`, object, config)
        .then(response => {
            console.log(response)
        })
        .catch(() => {
            throw "Algo de errado aconteceu"
        })
}

export const createOferta = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const imagem = await uploadFile(formData.get("imagens"))
    formData.set("imagens", imagem)
    formData.set("vencimento", formatarData(formData.get("vencimento")))
    var object = {};
    formData.forEach((value, key) => {
        if (value === "true") {
            object[key] = true;
            return;
        }
        if (value === "false") {
            object[key] = false;
            return;
        }
        if (key === "imagens") {
            object[key] = [value]
            return;
        }

        // Verifica se o valor não é uma string vazia antes de tentar a conversão numérica
        const numericValue = value !== "" ? (isNaN(value) ? value : parseFloat(value)) : value;

        // Atribui o valor ao objeto
        object[key] = numericValue;
    });
    console.log("OBJETO", object)
    console.log("URL", `${mainUrl}${url}`)
    await axios.post(`${mainUrl}${url}`, object, config)
        .then(response => {
            console.log(response)
            event.target.reset()
        })
        .catch(() => {
            throw "Algo de errado aconteceu"
        })
}

export const createSubAccount = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const imagem = await uploadFile(formData.get("imagem"))
    formData.set("imagem", imagem)
    const object = formHandler(formData)
    console.table("OBJETO", object)
    return
    await axios.post(`${mainUrl}contas/criar-subconta/${state.user.idUsuario}`, object, config)
        .then(response => {
            console.log(response)
            event.target.reset()
        })
        .catch(() => {
            throw "Algo de errado aconteceu"
        })
}
export const createUser = async (event, url) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const imagem = await uploadFile(formData.get("imagem"))
    formData.set("imagem", imagem)

    const object = formHandler(formData)
    const {
        taxaRepasseMatriz, limiteCredito, limiteCreditoPermuta, limiteVendaMensal, limiteVendaTotal, limiteVendaEmpresa, diaFechamentoFatura, dataVencimentoFatura, formaPagamento, nomeFranquia, planoId, gerente: accountManager, tipo: accountType, plano: accountPlan
    } = object
    delete object.taxaRepasseMatriz
    delete object.limiteCredito
    delete object.limiteCreditoPermuta
    delete object.limiteVendaMensal
    delete object.limiteVendaTotal
    delete object.limiteVendaEmpresa
    delete object.diaFechamentoFatura
    delete object.dataVencimentoFatura
    delete object.nomeFranquia
    delete object.planoId
    delete object.gerente
    delete object.tipo
    delete object.plano
    delete object.formaPagamento


    console.log("O QUE FOI ENVIADO")
    console.table(object)
    const response = await axios.post(`${mainUrl}${url}`, object, config);
    if (!response) {
        throw new Error("Erro ao criar usuário, por favor cheque os campos e tente novamente")
    }
    event.target.reset();
    console.log('Usuário criado:', response.data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Forma de pagamento:", accountType)
    const userAccount = await axios.post(`${mainUrl}contas/criar-conta-para-usuario/${response.data.idUsuario}`, {
        "planoId": planoId,
        'tipoDaConta': accountType,
        "saldoPermuta": 0,
        "limiteCredito": limiteCredito,
        "limiteVendaMensal": limiteVendaMensal,
        "limiteVendaTotal": limiteVendaTotal,
        "limiteVendaEmpresa": 0,
        "valorVendaMensalAtual": 0,
        "valorVendaTotalAtual": 0,
        "taxaRepasseMatriz": taxaRepasseMatriz,
        "diaFechamentoFatura": dataVencimentoFatura,
        "dataVencimentoFatura": dataVencimentoFatura,
        "nomeFranquia": nomeFranquia,
    }, config).catch((error) => console.log(error))
    if (!userAccount) {
        throw new Error("Erro ao criar conta do usuário, por favor entrar em contato com suporte")
    }
    console.log("Conta criada", userAccount)
    const payPlan = await axios.post(`${mainUrl}contas/pagamento-do-plano/${response.data.idUsuario}`, {
        "formaPagamento": formaPagamento || 0,
        "idPlano": planoId,
    }, config)
    if (!payPlan) {
        throw new Error("Erro ao cobrar plano do usuário, por favor entrar em contato com suporte")
    }
    console.log("Plano pago")
    const addManager = await axios.post(`${mainUrl}contas/adicionar-gerente/${userAccount.data.idConta}/${accountManager}`, {}, config).catch((error) => console.log(error))
    if (!addManager) {
        throw new Error("Erro ao adicionar gerente a conta, por favor entre em contato com suporte")
    }
    console.log("Gerente adicionado")
}

export const createT = async (event) => {
    const object = formHandler(event)
    console.table(object)
    const { voucher } = object
    delete object.voucher
    const response = await axios.post(`${mainUrl}transacoes/inserir-transacao`, object, config)
    if (!response) {
        throw new Error("Erro ao criar transação, por favor cheque os campos e tente novamente")
    }
    if (voucher) {
        const voucherResponse = await axios.post(`${mainUrl}transacoes/criar-voucher/${response.data.novaTransacao.idTransacao}`, config)
        if (!voucherResponse) {
            throw new Error("Erro ao criar voucher, por favor entre em contato com suporte")
        }
    }
};

export const editUser = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    if (formData.get("imagem")) {
        if (formData.get("imagem").name === "") {
            formData.delete("imagem")
        } else {
            const imagem = await uploadFile(formData.get("imagem"))
            formData.set("imagem", imagem)
        }
    }
    const object = formHandler(formData)

    const { limiteCredito, limiteVendaMensal, limiteVendaTotal, nomeFranquia, gerente, tipo, planoId, contaId, dataVencimentoFatura, taxaRepasseMatriz, idUsuario } = object
    delete object.limiteCredito
    delete object.limiteVendaMensal
    delete object.limiteVendaTotal
    delete object.nomeFranquia
    delete object.gerente
    delete object.tipo
    delete object.planoId
    delete object.contaId
    delete object.idUsuario
    delete object.contaId
    delete object.dataVencimentoFatura
    delete object.taxaRepasseMatriz


    console.log("O QUE FOI ENVIADO", object)
    console.log(`url : ${mainUrl}usuarios/atualizar-usuario/${idUsuario}`)
    const response = await axios.put(`${mainUrl}usuarios/atualizar-usuario/${idUsuario}`, object, config)
    if (!response) {
        throw new Error("Erro ao editar usuário, por favor cheque os campos e tente novamente")
    }
    console.log("planoId", planoId)
    const account = axios.put(`${mainUrl}contas/atualizar-conta/${contaId}`, {
        "planoId": planoId,
        'tipoDaConta': tipo,
        "saldoPermuta": 0,
        "limiteCredito": limiteCredito,
        "limiteVendaMensal": limiteVendaMensal,
        "limiteVendaTotal": limiteVendaTotal,
        "diaFechamentoFatura": dataVencimentoFatura,
        "dataVencimentoFatura": dataVencimentoFatura,
        "nomeFranquia": nomeFranquia,
        "taxaRepasseMatriz": taxaRepasseMatriz,
    }, config).catch(error => console.log(error))
    if (!account) {
        throw new Error("Erro ao editar usuário")
    }
    // const addManager = await axios.post(`${mainUrl}contas/adicionar-gerente/${contaId}/${gerente}`).catch(error => console.log(error))
    // if (!addManager) {
    //     throw new Error("Erro ao adicionar gerente a conta, por favor entre em contato com suporte")
    // }
};

export const updateUser = () => { }

export const editItem = async (event, url, setState, oferta) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    if (formData.get("imagem")) {
        if (formData.get("imagem").name === "") {
            formData.delete("imagem")
        } else {
            const imagem = await uploadFile(formData.get("imagem"))
            formData.set("imagem", imagem)
        }
    }

    if (formData.get("vencimento")) {
        formData.set("vencimento", formatarData(formData.get("vencimento")))
    }
    const object = formHandler(formData)
    if (oferta) {
        object.imagem = [object.imagem]
    }
    console.log("O QUE FOI ENVIADO", object)
    const response = await axios.put(`${mainUrl}${url}`, object, config)
    if (!response) {
        throw new Error("Erro ao editar item, por favor cheque os campos e tente novamente")
    }
    if (setState) {
        setState(true)
    }
}

export const deleteItem = (url, revalidate, message, titulo) => {
    console.log(url)
    axios.delete(`${mainUrl}${url}`, config)
        .then(response => {
            console.log(response)
            popup(message, titulo)
            revalidate()
        })
}

export const deleteCredito = (url, item) => {
    axios.put(`${mainUrl}${url}`, item, config)
        .then((result) => console.log(result))
}
export const aprove = (url, item) => {
    axios.put(`${mainUrl}${url}`, item, config)
        .then((result) => console.log(result))
}

export const negate = (url, item) => {
    axios.put(`${mainUrl}${url}`, item, config)
        .then((result) => console.log(result))
}


export const bloqUser = (userId) => {
    console.log(userId)
    const url = `usuarios/atualizar-usuario/${userId}`
    const item = {
        "bloqueado": true,
        "status": false
    }
    axios.put(`${mainUrl}${url}`, item, config, config)
        .then((result) => console.log(result))
        .catch(error => console.log(error))
}
// EXTORNO
export const refound = async (id, revalidate) => {
    axios.post(`${mainUrl}transacoes/encaminhar-estorno/${id}`, config)
        .then(result => {
            console.log(result)
            revalidate()
            toast.success("Extorno solicitado com sucesso")
        })
        .catch(error => console.log(error))
}
export const sendRefound = async (id, revalidate) => {
    axios.post(`${mainUrl}transacoes/encaminhar-estorno-matriz/${id}`, config)
        .then(result => {
            console.log(result)
            revalidate()
            toast.success("Extorno encaminhado com sucesso")
        })
        .catch(error => {
            console.log(error)
            toast.error("Erro ao encaminhar")
        })
}
export const aproveRefound = async (id, revalidate) => {
    axios.post(`${mainUrl}transacoes/estornar-transacao/${id}`, config)
        .then(result => {
            console.log(result)
            revalidate()
            toast.success("Extorno aprovado com sucesso")
        })
        .catch(error => {
            console.log(error)
            toast.error("Erro ao aprovar")
        })
}


export const formatDate = (dataString, full) => {
    const data = new Date(dataString);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');  // Os meses são base 0, então é necessário adicionar 1.
    const ano = data.getFullYear();

    if (full) {
        const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const monthName = monthNames[data.getMonth()];
        return `Termina em ${dia} de ${monthName} de ${ano}`;
    } else {
        return `${dia}/${mes}/${ano}`;
    }

}