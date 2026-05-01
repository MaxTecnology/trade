import { z } from 'zod'

export const createOfferSchema = z.object({
  titulo: z.string().min(3),
  descricao: z.string().min(10),
  categoriaId: z.string().uuid(),
  valorRT: z.number().positive(),
  quantidadeDisponivel: z.number().int().positive(),
  tipoAtendimento: z.array(z.enum(['presencial', 'online', 'voucher'])).min(1),
  cidade: z.string(),
  estado: z.string().length(2),
})

export const updateOfferSchema = createOfferSchema.partial()

export const statusSchema = z.object({
  status: z.enum(['aberta', 'fechada', 'pausada']),
})

export const listOfferQuerySchema = z.object({
  categoria: z.string().uuid().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2).optional(),
  valorMin: z.coerce.number().optional(),
  valorMax: z.coerce.number().optional(),
  tipoAtendimento: z.enum(['presencial', 'online', 'voucher']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateOfferInput = z.infer<typeof createOfferSchema>
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>
export type ListOfferQuery = z.infer<typeof listOfferQuerySchema>
