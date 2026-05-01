import { z } from "zod"
export const associadoSchema = z.object({
    // GERAL
    razaoSocial: z.string().min(3, "Obrigatório"),
    nomeFantasia: z.string().min(3, "Obrigatório"),
    descricao: z.string().min(3, "Obrigatório"),
    email: z.string().email().min(5, "Obrigatório"),
    status: z.string().min(1, "Obrigatório"),
    tipo: z.string().min(1, "Obrigatório"),
    cnpj: z.string().min(18, "Obrigatório"),
    inscEstadual: z.string().optional(),
    inscMunicipal: z.string().optional(),
    restricao: z.string().optional(),
    mostrarNoSite: z.string().min(3, "Obrigatório"),

    // CONTATO
    nomeContato: z.string().min(3, "Obrigatório"),
    telefone: z.string().optional(),
    celular: z.string().min(14, "Obrigatório"),
    emailContato: z.string().email().min(5, "Obrigatório"),
    emailSecundario: z.string().email().optional(),
    site: z.string().optional(),

    // ENDEREÇO
    logradouro: z.string().min(3, "Obrigatório"),
    numero: z.string().min(1, "Obrigatório"),
    cep: z.string().min(9, "Obrigatório"),
    complemento: z.string().optional(),
    bairro: z.string().min(3, "Obrigatório"),
    cidade: z.string().min(3, "Obrigatório"),
    estado: z.string().min(2, "Obrigatório"),
    regiao: z.string().optional(),

    // // AGÊNCIA
    formaPagamento: z.string().min(1, "Obrigatório"),
    dataVencimentoFatura: z.string().min(1, "Obrigatório"),
    nomeFranquia: z.string().optional(),

    // OPERAÇÕES
    gerente: z.string().min(1, "Obrigatório"),
    tipoOperacao: z.string().min(1, "Obrigatório"),
    limiteCredito: z.string().min(3, "Obrigatório"),
    limiteVendaMensal: z.string().min(3, "Obrigatório"),
    limiteVendaTotal: z.string().min(3, "Obrigatório"),
    aceitaOrcamento: z.string().min(1, "Obrigatório"),
    aceitaVoucher: z.string().min(1, "Obrigatório"),

    // DADOS USUÁRIO
    imagem: z.any().refine((files) => {
        return files?.[0];
    }, `Selecione uma imagem.`),
    cpf: z.string().min(1, "Obrigatório"),
    senha: z.string().min(3, "Obrigatório"),
    nome: z.string().min(3, "Obrigatório"),

    // CATEGORIA
    categoriaId: z.string().optional(),
    subcategoriaId: z.string().optional(),

    // PLANOS
    planoId: z.string().optional(),

    // INVISIBLE
    reputacao: z.number().optional(),
    usuarioCriadorId: z.number().optional(),
    tipoDeMoeda: z.string().optional(),
    statusConta: z.boolean().optional(),
    taxaRepasseMatriz: z.any().optional(),
})