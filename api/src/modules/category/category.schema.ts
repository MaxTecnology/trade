import { z } from 'zod'

export const createCategorySchema = z.object({
  nome: z.string().min(2),
  categoriaParenteId: z.string().uuid().nullable().optional(),
  ativo: z.boolean().default(true),
})

export const updateCategorySchema = createCategorySchema.partial()
export const statusSchema = z.object({ ativo: z.boolean() })

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
