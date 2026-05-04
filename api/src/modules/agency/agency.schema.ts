import { z } from 'zod'

const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string(),
  estado: z.string().length(2),
  cep: z.string().optional(),
  regiao: z.string().optional(),
})

export const createAgencySchema = z.object({
  // Identificação
  nome: z.string().min(2),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14),
  inscEstadual: z.string().optional(),
  inscMunicipal: z.string().optional(),
  tipo: z.enum(['master', 'comum']),
  email: z.string().email(),
  telefone: z.string().optional(),
  imagemUrl: z.string().optional(),
  agenciaParenteId: z.string().uuid().nullable().optional(),
  planoId: z.string().uuid().optional(),

  // Contato
  nomeContato: z.string().optional(),
  celular: z.string().optional(),
  emailSecundario: z.string().email().optional(),

  // Endereço
  endereco: enderecoSchema,

  // Operacional
  limiteCredito: z.number().optional(),
  limiteVendaMensal: z.number().optional(),
  limiteVendaTotal: z.number().optional(),
  taxaRepasseMatriz: z.number().optional(),
  diaVencimentoFatura: z.number().int().optional(),

  // Usuário administrador da agência
  usuarioNome: z.string().optional(),
  usuarioCpf: z.string().optional(),
  usuarioEmail: z.string().email().optional(),
  senha: z.string().min(8).optional(),
})

export const updateAgencySchema = z.object({
  nome: z.string().min(2).optional(),
  nomeFantasia: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  imagemUrl: z.string().optional(),
  planoId: z.string().uuid().optional(),
  nomeContato: z.string().optional(),
  celular: z.string().optional(),
  emailSecundario: z.string().email().optional(),
  endereco: enderecoSchema.partial().optional(),
  limiteCredito: z.number().optional(),
  limiteVendaMensal: z.number().optional(),
  limiteVendaTotal: z.number().optional(),
  taxaRepasseMatriz: z.number().optional(),
  diaVencimentoFatura: z.number().int().optional(),
})

export const statusSchema = z.object({ status: z.enum(['ativo', 'suspenso', 'inativo']) })

export type CreateAgencyInput = z.infer<typeof createAgencySchema>
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>
