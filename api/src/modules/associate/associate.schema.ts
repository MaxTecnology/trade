import { z } from 'zod'

export const createAssociateSchema = z.object({
  // Identificação
  nome: z.string().min(2),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14),
  descricao: z.string().optional(),
  inscEstadual: z.string().optional(),
  inscMunicipal: z.string().optional(),
  restricao: z.string().optional(),
  imagemUrl: z.string().optional(),
  mostrarNoSite: z.boolean().default(true),
  aceitaOrcamento: z.boolean().default(true),
  categoriaId: z.string().uuid().optional(),

  // Contato principal
  email: z.string().email(),
  telefone: z.string().optional(),

  // Contato secundário
  nomeContato: z.string().optional(),
  celular: z.string().optional(),
  emailContato: z.string().email().optional(),
  emailSecundario: z.string().email().optional(),
  site: z.string().optional(),

  // Endereço
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string(),
  estado: z.string().length(2),
  cep: z.string().optional(),
  regiao: z.string().optional(),

  // Vinculação
  agenciaId: z.string().uuid().optional(),
  gerenteId: z.string().uuid().optional(),
  planoId: z.string().uuid(),
  tipoAtendimento: z.array(z.enum(['presencial', 'online', 'voucher'])).min(1),

  // Operacional
  tipoOperacao: z.enum(['compra', 'venda', 'compra_venda']).optional(),
  formaPagamento: z.number().int().optional(),
  diaVencimentoFatura: z.number().int().optional(),
  valorInscricaoBRL: z.number().optional(),
  valorInscricaoRT: z.number().optional(),
  limiteCredito: z.number().optional(),
  limiteVendaMensal: z.number().optional(),
  limiteVendaTotal: z.number().optional(),

  // Acesso
  senha: z.string().min(8),
  cpf: z.string().optional(),
})

export const updateAssociateSchema = z.object({
  nome: z.string().min(2).optional(),
  status: z.enum(['ativo', 'suspenso', 'inativo']).optional(),
  nomeFantasia: z.string().optional(),
  descricao: z.string().optional(),
  inscEstadual: z.string().optional(),
  inscMunicipal: z.string().optional(),
  restricao: z.string().optional(),
  imagemUrl: z.string().optional(),
  mostrarNoSite: z.boolean().optional(),
  aceitaOrcamento: z.boolean().optional(),
  categoriaId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  nomeContato: z.string().optional(),
  celular: z.string().optional(),
  emailContato: z.string().email().optional(),
  emailSecundario: z.string().email().optional(),
  site: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2).optional(),
  cep: z.string().optional(),
  regiao: z.string().optional(),
  tipoAtendimento: z.array(z.enum(['presencial', 'online', 'voucher'])).optional(),
  tipoOperacao: z.enum(['compra', 'venda', 'compra_venda']).optional(),
  formaPagamento: z.number().int().optional(),
  diaVencimentoFatura: z.number().int().optional(),
  valorInscricaoBRL: z.number().optional(),
  valorInscricaoRT: z.number().optional(),
  limiteCredito: z.number().optional(),
  limiteVendaMensal: z.number().optional(),
  limiteVendaTotal: z.number().optional(),
})

export const statusSchema = z.object({ status: z.enum(['ativo', 'suspenso', 'inativo']) })
export const lojaSchema = z.object({ statusLoja: z.enum(['aberta', 'fechada', 'pausada']) })

export type CreateAssociateInput = z.infer<typeof createAssociateSchema>
export type UpdateAssociateInput = z.infer<typeof updateAssociateSchema>
