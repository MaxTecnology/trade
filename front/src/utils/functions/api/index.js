import axios from "axios";
import state from "@/store";
import { uploadFile } from "@/FirebaseConfig";
import { formHandler, formatForm } from "../formHandler";

const config = {
    headers: {
        Authorization: `Bearer ${localStorage.getItem('tokenRedeTrade')}`
    }
};

const mainUrl = `${state.url}`

export async function newPassword(event, id) {
    const response = await axios.post(`${mainUrl}usuarios/redefinir-senha-usuario/${id}`, event).catch((err) => {
        throw new Error(err.response.data.error)
    })
    return "Senha redefinida com sucesso!"
}
export async function forgotPassword(event) {
    const formData = new FormData(event.target)
    const object = formHandler(formData)
    const response = await axios.post(`${mainUrl}usuarios/solicitar-redefinicao-senha-usuario/`, object)
    return "Mensagem enviada para o seu e-mail!"
}

export const createUser = async (event, url) => {
    console.log(event)
    const imagem = await uploadFile(event.imagem)
    event.imagem = imagem
    const formatedEvent = formatForm(event)
    const {
        taxaRepasseMatriz, limiteCredito, limiteCreditoPermuta, limiteVendaMensal, limiteVendaTotal, limiteVendaEmpresa, diaFechamentoFatura, dataVencimentoFatura, formaPagamento, nomeFranquia, planoId, gerente: accountManager, tipo: accountType, plano: accountPlan
    } = formatedEvent

    delete formatedEvent.taxaRepasseMatriz
    delete formatedEvent.limiteCredito
    delete formatedEvent.limiteCreditoPermuta
    delete formatedEvent.limiteVendaMensal
    delete formatedEvent.limiteVendaTotal
    delete formatedEvent.limiteVendaEmpresa
    delete formatedEvent.diaFechamentoFatura
    delete formatedEvent.dataVencimentoFatura
    delete formatedEvent.nomeFranquia
    delete formatedEvent.planoId
    delete formatedEvent.gerente
    delete formatedEvent.plano
    delete formatedEvent.formaPagamento


    console.log("O QUE FOI ENVIADO")
    console.table(formatedEvent)
    const response = await axios.post(`${mainUrl}${url}`, formatedEvent, config)
        .catch(() => {
            throw new Error("Erro ao criar usuário, por favor cheque os campos e tente novamente")
        });


    console.log('Usuário criado:', response.data);
    await new Promise(resolve => setTimeout(resolve, 1000));
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
    }, config)
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
    const addManager = await axios.post(`${mainUrl}contas/adicionar-gerente/${userAccount.data.idConta}/${accountManager}`, {}, config)
    if (!addManager) {
        throw new Error("Erro ao adicionar gerente a conta, por favor entre em contato com suporte")
    }
    console.log("Gerente adicionado")
}

function transformarDados(dados) {
    const resultado = {};

    Object.keys(dados).forEach((chave) => {
        const permissao = dados[chave];

        if (Object.prototype.hasOwnProperty.call(dados, chave)) {
            if (typeof permissao === 'object' && permissao !== null && !Array.isArray(permissao)) {
                resultado[chave] = Object.keys(permissao).filter(subChave => permissao[subChave] === true && subChave !== 'field');
            } else if (permissao === true && chave !== 'field') {
                resultado[chave] = [chave];
            } else if (Array.isArray(permissao) && permissao.length > 0) {
                resultado[chave] = permissao.filter(item => item !== 'field');
            }
        }
    });

    return resultado;
}

export async function createSubAccount(event) {

    const { email, senha, imagem, cpf, nome } = event
    const imagemUrl = await uploadFile(imagem)
    const userData = {
        "nome": nome,
        "email": email,
        "cpf": cpf,
        "senha": senha,
        "imagem": imagemUrl
    }
    console.log(userData)
    const response = await axios.post(`${mainUrl}contas/criar-subconta/${state.user.conta.idConta}`, userData, config)
        .catch(() => {
            throw new Error("Erro ao criar usuário, por favor cheque os campos e tente novamente")
        });
    console.log('Usuário criado:', response.data)


    const { atendimento, compras, extratos, faturas, meusUsuarios, minhaConta, ofertas, permissoesConta, vendas, vouchers } = event
    const permissoes = {
        atendimento, compras, extratos, faturas, meusUsuarios, minhaConta, ofertas, permissoesConta, vendas, vouchers
    }
    let permissoesArray = [JSON.stringify(permissoes)]
    const resultado = transformarDados(permissoes)
    console.table(resultado)



    const subconta = await axios.post(`${mainUrl}contas/subcontas/adicionar-permissao/${response.data.idSubContas}`, permissoesArray, config)
        .catch((err) => {
            throw new Error("Erro ao criar usuário, por favor cheque os campos e tente novamente")
        });
    console.log("Sub-conta criada", subconta)
}

export async function updateCharge(id, revalidate) {
    const object = {
        status: "Quitado"
    }
    axios.put(`${mainUrl}cobrancas/atualizar-cobranca/${id}`, object, config).then(res => {
        revalidate()
        return res
    })
}