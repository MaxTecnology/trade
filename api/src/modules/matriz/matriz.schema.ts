import { z } from 'zod'

export const updateLimiteCreditoSchema = z.object({
  limiteCredito: z.number().nonnegative(),
})

export type UpdateLimiteCreditoInput = z.infer<typeof updateLimiteCreditoSchema>
