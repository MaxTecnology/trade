import { z } from 'zod'

export const permutaSchema = z.object({
  ofertaId: z.string().uuid(),
  quantidade: z.number().int().positive().default(1),
  parcelas: z.number().int().min(1).max(12).default(1),
})

export const transferenciaSchema = z.object({
  contaDestinoId: z.string().uuid(),
  valorRT: z.number().positive(),
  descricao: z.string().optional(),
})

export const creditoSchema = z.object({
  contaDestinoId: z.string().uuid(),
  valorRT: z.number().positive(),
  descricao: z.string().optional(),
})

export const listTransactionQuerySchema = z.object({
  tipo: z.enum(['permuta', 'transferencia', 'credito', 'estorno']).optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type PermutaInput = z.infer<typeof permutaSchema>
export type TransferenciaInput = z.infer<typeof transferenciaSchema>
export type CreditoInput = z.infer<typeof creditoSchema>
export type ListTransactionQuery = z.infer<typeof listTransactionQuerySchema>
