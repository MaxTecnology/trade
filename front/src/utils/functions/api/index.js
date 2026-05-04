import api from "@/services/api";
import state from "@/store";
import { formHandler, formatForm } from "../formHandler";

const uploadToB2 = async (file) => {
    if (!file || file.size === 0) return null
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.url
}

export async function newPassword(event, id) {
    await api.patch(`usuarios/${id}/senha`, event).catch((err) => {
        throw new Error(err?.response?.data?.message ?? "Erro ao redefinir senha")
    })
    return "Senha redefinida com sucesso!"
}

export async function forgotPassword(event) {
    const formData = new FormData(event.target)
    const object = formHandler(formData)
    await api.post('auth/forgot-password', object)
    return "Mensagem enviada para o seu e-mail!"
}

export const createUser = async (event, url) => {
    const imagemFile = event.imagem
    if (imagemFile) {
        const imagemUrl = await uploadToB2(imagemFile)
        event.imagem = imagemUrl
    }
    const formatedEvent = formatForm(event)
    await api.post(url, formatedEvent).catch((err) => {
        throw new Error(err?.response?.data?.message ?? "Erro ao criar registro")
    })
}

export async function createSubAccount(event) {
    const { email, senha, nome } = event
    const imagemUrl = await uploadToB2(event.imagem)
    await api.post('usuarios', {
        nome,
        email,
        senha,
        role: 'associate_operator',
        associadoId: state.user.entityId,
        imagem: imagemUrl,
    }).catch(() => {
        throw new Error("Erro ao criar usuário")
    })
}

export async function updateCharge(id, revalidate) {
    await api.patch(`cobrancas/${id}/quitar`)
    if (revalidate) revalidate()
}
