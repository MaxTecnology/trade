import { z } from 'zod'

export const createPlanSchema = z.object({
  nome: z.string().min(2),
  tipoPlano: z.enum(['agencia', 'associado', 'gerente']).default('associado'),
  limiteRT: z.number().nonnegative().default(0),
  percentualComissao: z.number().min(0).max(100),
  taxaInscricaoRT: z.number().min(0).default(0),
  taxaManutencaoAnualRT: z.number().min(0).default(0),
  ativo: z.boolean().default(true),
})

export const updatePlanSchema = createPlanSchema.partial()
export const statusSchema = z.object({ ativo: z.boolean() })

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
