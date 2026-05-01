import { z } from 'zod'

const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  cidade: z.string(),
  estado: z.string().length(2),
  cep: z.string().optional(),
})

export const createAssociateSchema = z.object({
  nome: z.string().min(2),
  cnpj: z.string().min(14),
  email: z.string().email(),
  telefone: z.string().optional(),
  agenciaId: z.string().uuid(),
  gerenteId: z.string().uuid(),
  planoId: z.string().uuid(),
  tipoAtendimento: z.array(z.enum(['presencial', 'online', 'voucher'])).min(1),
  endereco: enderecoSchema,
})

export const updateAssociateSchema = createAssociateSchema
  .omit({ cnpj: true, agenciaId: true, gerenteId: true, planoId: true })
  .partial()

export const statusSchema = z.object({ status: z.enum(['ativo', 'suspenso', 'inativo']) })
export const lojaSchema = z.object({ statusLoja: z.enum(['aberta', 'fechada', 'pausada']) })

export type CreateAssociateInput = z.infer<typeof createAssociateSchema>
export type UpdateAssociateInput = z.infer<typeof updateAssociateSchema>
