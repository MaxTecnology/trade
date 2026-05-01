import { z } from 'zod'

export const createPlanSchema = z.object({
  nome: z.string().min(2),
  limiteRT: z.number().positive(),
  percentualComissao: z.number().min(0).max(100),
  periodicidade: z.enum(['mensal', 'anual']),
  maxParcelas: z.number().int().min(1).max(12).default(1),
  ativo: z.boolean().default(true),
})

export const updatePlanSchema = createPlanSchema.partial()
export const statusSchema = z.object({ ativo: z.boolean() })

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
