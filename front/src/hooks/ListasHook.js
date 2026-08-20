import axios from "axios";
import state from "../store";
import { popup } from "./Popup";
import { toast } from "sonner";
import { formHandler } from "../utils/functions/formHandler";
import { getUserInfo } from "../auth/authFunction";
import api from "../services/api";


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
    // form field é "login" mas API espera "email"
    if (object.login) { object.email = object.login; delete object.login }
    const loginPromise = api.post('auth/login', object)
        .then(async (response) => {
            const token = response.data.data.accessToken
            localStorage.setItem('tokenRedeTrade', token)
            await getUserInfo()
            return state.user?.nomeFantasia ?? 'Usuário'
        })
    toast.promise(loginPromise, {
        loading: 'Realizando login...',
        success: (nome) => {
            setLoading(false)
            setTimeout(() => { window.location.href = "/" }, 500)
            return `${nome} seja bem vindo!`
        },
        error: (err) => {
            setLoading(false)
            console.log(err)
            return "Erro ao realizar login"
        },
    });
}

export const getApiData = async (url, setState) => {
    return api.get(url)
        .then((response) => {
            if (setState) setState(response.data)
            return response.data
        })
        .catch((error) => {
            console.log(error)
            return error
        })
}
export const postItem = async (url, body, setData) => {
    return api.post(url, body)
        .then((response) => {
            if (setData) setData(response.data)
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

// Upload para B2 (substitui Firebase)
const uploadToB2 = async (file) => {
    if (!file || file.size === 0) return null
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data.url
}

export const requestCredit = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const data = formHandler(formData)
    await api.post(url, data).catch(() => { throw "Algo de errado aconteceu" })
}

// CRÉDITOS HANDLER
export const aproveCreditos = async (id, respostaMatriz, modalHandler, setState) => {
    toast.promise(api.patch(`creditos/${id}/aprovar`, { respostaMatriz }), {
        loading: 'Aprovando crédito...',
        success: () => { modalHandler(); setState(true); return "Crédito aprovado com sucesso!" },
        error: (error) => error?.response?.data?.error?.message ?? "Erro ao aprovar Crédito",
    })
}
export const negateCreditos = async (id, respostaMatriz, modalHandler, setState) => {
    toast.promise(api.patch(`creditos/${id}/negar`, { respostaMatriz }), {
        loading: 'Negando crédito...',
        success: () => { modalHandler(); setState(true); return "Crédito negado com sucesso!" },
        error: (error) => error?.response?.data?.error?.message ?? "Erro ao negar Crédito",
    })
}
export const forwardCreditos = async (id, modalHandler, setState) => {
    toast.promise(api.patch(`creditos/${id}/encaminhar`), {
        loading: 'Encaminhando crédito...',
        success: () => { modalHandler(); setState(true); return "Crédito encaminhado com sucesso!" },
        error: () => "Erro ao encaminhar Crédito",
    })
}
export const deleteCreditos = async (id, modalHandler, setState) => {
    toast.promise(api.delete(`creditos/${id}`), {
        loading: 'Deletando solicitação...',
        success: () => { modalHandler(); setState(true); return "Solicitação deletada com sucesso!" },
        error: () => "Erro ao deletar solicitação",
    })
}
export const atualizarCreditos = async (event, id, modalHandler, setState) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const data = formHandler(formData)
    toast.promise(api.put(`creditos/${id}`, data), {
        loading: 'Editando solicitação...',
        success: () => { modalHandler(); setState(true); return "Solicitação editada com sucesso!" },
        error: () => "Erro ao editar Crédito",
    })
}

export const createItem = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const object = formHandler(formData)
    await api.post(url, object).catch(() => { throw "Algo de errado aconteceu" })
}

export const createItemWithImage = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const imagemFile = formData.get("imagens")
    const imagemUrl = await uploadToB2(imagemFile)
    if (imagemUrl) formData.set("imagens", imagemUrl)
    const object = formHandler(formData)
    await api.post(url, object).catch(() => { throw "Algo de errado aconteceu" })
}

export const createOferta = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const imagemFile = formData.get("imagens")
    const imagemUrl = await uploadToB2(imagemFile)
    const tipoAtendimento = formData.getAll("tipoAtendimento")
    formData.delete("imagens")
    formData.delete("tipoAtendimento")
    if (formData.get("vencimento")) {
        formData.set("vencimento", formatarData(formData.get("vencimento")))
    } else {
        formData.delete("vencimento")
    }
    const object = {}
    formData.forEach((value, key) => {
        if (value === "true") { object[key] = true; return }
        if (value === "false") { object[key] = false; return }
        const numericValue = value !== "" ? (isNaN(value) ? value : parseFloat(value)) : value
        object[key] = numericValue
    })
    if (imagemUrl) object.imagemUrl = imagemUrl
    object.tipoAtendimento = tipoAtendimento
    await api.post(url, object)
        .then(() => event.target.reset())
        .catch((err) => { throw new Error(err?.response?.data?.error?.message ?? "Erro ao cadastrar oferta") })
}

export const createSubAccount = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const object = formHandler(formData)
    const { nome, email, senha } = object
    await api.post('usuarios', {
        nome,
        email,
        senha,
        role: 'associate_operator',
        associadoId: state.user.entityId,
    }).catch(() => { throw "Erro ao criar usuário" })
}

export const createUser = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const imagemFile = formData.get("imagem")
    const imagemUrl = await uploadToB2(imagemFile)
    if (imagemUrl) formData.set("imagem", imagemUrl)
    const object = formHandler(formData)
    await api.post(url, object)
        .then(() => event.target.reset())
        .catch((err) => {
            throw new Error(err?.response?.data?.error?.message ?? "Erro ao criar registro")
        })
}

// Cria uma negociação direta entre associados (fora do marketplace de Ofertas) e,
// se houver nota de atendimento no formulário, avalia a transação logo em seguida.
export const createT = async (formData) => {
    const object = formHandler(formData)
    const { voucher, nomeComprador, nomeVendedor, notaAtendimento, observacaoNota, ...data } = object
    let response
    try {
        response = await api.post('transacoes/negociada', data)
    } catch (err) {
        throw new Error(err?.response?.data?.error?.message ?? "Erro ao criar transação")
    }
    const transacaoId = response?.data?.data?.id
    if (transacaoId && notaAtendimento) {
        try {
            await api.patch(`transacoes/${transacaoId}/avaliar`, {
                notaAtendimento: Number(notaAtendimento),
                comentarioAvaliacao: observacaoNota || undefined,
            })
        } catch (err) {
            // A transação já foi concluída; falha na avaliação não deve reverter o fluxo.
            console.error('Erro ao registrar avaliação:', err?.response?.data?.error?.message)
        }
    }
    return response
};

export const editUser = async (event, url) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const imagemFile = formData.get("imagem")
    if (imagemFile && imagemFile.name !== '') {
        const imagemUrl = await uploadToB2(imagemFile)
        if (imagemUrl) formData.set("imagem", imagemUrl)
        else formData.delete("imagem")
    } else {
        formData.delete("imagem")
    }
    const object = formHandler(formData)
    const { idUsuario, contaId, ...data } = object
    const targetUrl = url ?? `usuarios/${idUsuario}`
    await api.put(targetUrl, data).catch((err) => {
        throw new Error(err?.response?.data?.error?.message ?? "Erro ao editar")
    })
}

export const updateUser = () => { }

export const editItem = async (event, url, setState, oferta) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const imagemFile = formData.get("imagem")
    const imagemFieldName = oferta ? "imagemUrl" : "imagem"
    if (imagemFile && imagemFile.name !== '') {
        const imagemUrl = await uploadToB2(imagemFile)
        formData.delete("imagem")
        if (imagemUrl) formData.set(imagemFieldName, imagemUrl)
    } else {
        formData.delete("imagem")
    }
    let tipoAtendimento
    if (oferta) {
        tipoAtendimento = formData.getAll("tipoAtendimento")
        formData.delete("tipoAtendimento")
    }
    if (formData.get("vencimento")) {
        formData.set("vencimento", formatarData(formData.get("vencimento")))
    } else {
        formData.delete("vencimento")
    }
    const object = formHandler(formData)
    if (tipoAtendimento) object.tipoAtendimento = tipoAtendimento
    await api.put(url, object).catch((err) => {
        throw new Error(err?.response?.data?.error?.message ?? "Erro ao editar")
    })
    if (setState) setState(true)
}

export const deleteItem = (url, revalidate, message, titulo) => {
    api.delete(url)
        .then(() => {
            popup(message, titulo)
            revalidate()
        })
        .catch(error => console.log(error))
}

export const aprove = (url, item) => {
    api.put(url, item).then((result) => console.log(result))
}

export const negate = (url, item) => {
    api.put(url, item).then((result) => console.log(result))
}

export const bloqUser = (userId) => {
    api.patch(`usuarios/${userId}/status`, { status: 'suspenso' })
        .then((result) => console.log(result))
        .catch(error => console.log(error))
}

// EXTORNO — fluxo de solicitação/aprovação (mesmo padrão de Créditos RT)
// refound recebe o id da TRANSAÇÃO; sendRefound/aproveRefound/negarRefound recebem
// o id da SOLICITAÇÃO de estorno (SolicitacaoEstorno), não da transação original.
export const refound = async (transacaoId, motivo, revalidate) => {
    api.post('estornos', { transacaoId, motivo })
        .then(() => { revalidate?.(); toast.success("Estorno solicitado com sucesso") })
        .catch(error => toast.error(error?.response?.data?.error?.message ?? "Erro ao solicitar estorno"))
}
export const sendRefound = async (solicitacaoId, revalidate) => {
    api.patch(`estornos/${solicitacaoId}/encaminhar`)
        .then(() => { revalidate(); toast.success("Estorno encaminhado com sucesso") })
        .catch(error => toast.error(error?.response?.data?.error?.message ?? "Erro ao encaminhar"))
}
export const aproveRefound = async (solicitacaoId, respostaMatriz, revalidate) => {
    api.patch(`estornos/${solicitacaoId}/aprovar`, { respostaMatriz })
        .then(() => { revalidate?.(); toast.success("Estorno aprovado com sucesso") })
        .catch(error => toast.error(error?.response?.data?.error?.message ?? "Erro ao aprovar"))
}
export const negarRefound = async (solicitacaoId, respostaMatriz, revalidate) => {
    api.patch(`estornos/${solicitacaoId}/negar`, { respostaMatriz })
        .then(() => { revalidate?.(); toast.success("Estorno negado") })
        .catch(error => toast.error(error?.response?.data?.error?.message ?? "Erro ao negar"))
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