import { z } from 'zod'

export const createManagerSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
  percentualComissao: z.number().min(0).max(100),
  entityId: z.string().uuid(),
  entityType: z.enum(['matriz', 'agencia']),
})

export const updateManagerSchema = createManagerSchema
  .omit({ senha: true, entityId: true, entityType: true })
  .partial()

export const statusSchema = z.object({ ativo: z.boolean() })

export type CreateManagerInput = z.infer<typeof createManagerSchema>
export type UpdateManagerInput = z.infer<typeof updateManagerSchema>
