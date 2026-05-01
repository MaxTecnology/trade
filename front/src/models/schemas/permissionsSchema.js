import { z } from "zod"
export const permissionSchema = z.object({
    email: z.string().email().min(1, "Preenchimento obrigatório"),
    imagem: z.any().refine((files) => {
        return files?.[0];
    }, `Selecione uma imagem.`),
    cpf: z.string().min(1, "Preenchimento obrigatório"),
    senha: z.string().min(3, "Preenchimento obrigatório"),
    nome: z.string().min(3, "Preenchimento obrigatório"),
    negociacao: z.object({
        field: z.boolean().default(false),
        escrita: z.boolean().default(false),
        leitura: z.boolean().default(false),
        excluir: z.boolean().default(false)
    }).optional(),
    atendimento: z.object({
        field: z.boolean().default(false),
        escrita: z.boolean().default(false),
        leitura: z.boolean().default(false),
        excluir: z.boolean().default(false)
    }).optional(),
    minhaConta: z.object({
        field: z.boolean().default(false),
        escrita: z.boolean().default(false),
        leitura: z.boolean().default(false),
    }).optional(),
    meusUsuarios: z.object({
        field: z.boolean().default(false),
        escrita: z.boolean().default(false),
        leitura: z.boolean().default(false),
        excluir: z.boolean().default(false)
    }).optional(),
    permissoesConta: z.object({
        field: z.boolean().default(false),
        escrita: z.boolean().default(false),
        leitura: z.boolean().default(false),
        excluir: z.boolean().default(false)
    }).optional(),
    vendas: z.object({
        field: z.boolean().default(false),
        escrita: z.boolean().default(false),
        leitura: z.boolean().default(false),
        cancelamento: z.boolean().default(false)
    }).optional(),
    compras: z.object({
        field: z.boolean().default(false),
        leitura: z.boolean().default(false),
        solicitacaoCancelamento: z.boolean().default(false)
    }).optional(),
    vouchers: z.object({
        field: z.boolean().default(false),
        leitura: z.boolean().default(false),
        solicitar: z.boolean().default(false),
        aprovar: z.boolean().default(false),
        recusar: z.boolean().default(false),
    }).optional(),
    ofertas: z.object({
        field: z.boolean().default(false),
        escrita: z.boolean().default(false),
        leitura: z.boolean().default(false),
        solicitacaoCancelamento: z.boolean().default(false)
    }).optional(),
    extratos: z.object({
        field: z.boolean().default(false),
        leitura: z.boolean().default(false),
        extorno: z.boolean().default(false)
    }).optional(),
    faturas: z.object({
        field: z.boolean().default(false),
        leitura: z.boolean().default(false),
    }).optional(),
    comissoes: z.object({
        field: z.boolean().default(false),
        leitura: z.boolean().default(false),
    }).optional(),
})