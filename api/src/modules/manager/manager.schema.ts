import { z } from 'zod'

export const createManagerSchema = z.object({
  nome: z.string().min(2),
  cnpj: z.string().min(14),
  email: z.string().email(),
  senha: z.string().min(8),
  telefone: z.string().optional(),
  agenciaId: z.string().uuid().optional(),
  planoId: z.string().uuid(),
  logradouro: z.string().optional(),
  cidade: z.string(),
  estado: z.string().length(2),
  cep: z.string().optional(),
})

export const updateManagerSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
})

export const statusSchema = z.object({ ativo: z.boolean() })

export type CreateManagerInput = z.infer<typeof createManagerSchema>
export type UpdateManagerInput = z.infer<typeof updateManagerSchema>
