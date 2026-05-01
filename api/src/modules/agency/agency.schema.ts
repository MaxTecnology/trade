import { z } from 'zod'

const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  cidade: z.string(),
  estado: z.string().length(2),
  cep: z.string().optional(),
})

export const createAgencySchema = z.object({
  nome: z.string().min(2),
  cnpj: z.string().min(14),
  tipo: z.enum(['master', 'comum']),
  email: z.string().email(),
  telefone: z.string().optional(),
  endereco: enderecoSchema,
  agenciaParenteId: z.string().uuid().nullable().optional(),
})

export const updateAgencySchema = createAgencySchema
  .omit({ cnpj: true, tipo: true, agenciaParenteId: true })
  .partial()

export const statusSchema = z.object({ status: z.enum(['ativo', 'suspenso', 'inativo']) })

export type CreateAgencyInput = z.infer<typeof createAgencySchema>
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>
