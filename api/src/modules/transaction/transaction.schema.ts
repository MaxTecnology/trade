import { z } from 'zod'

export const permutaSchema = z.object({
  ofertaId: z.string().uuid(),
  quantidade: z.number().int().positive().default(1),
  parcelas: z.number().int().min(1).max(12).default(1),
})

// Negociação direta entre associados, fora do marketplace de ofertas — sempre em RT.
export const negociadaSchema = z.object({
  vendedorId: z.string().uuid(),
  valorRT: z.number().positive(),
  parcelas: z.number().int().min(1).max(12).default(1),
  descricao: z.string().optional(),
})

export const avaliarSchema = z.object({
  notaAtendimento: z.number().int().min(1).max(5),
  comentarioAvaliacao: z.string().optional(),
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
  tipo: z.enum(['permuta', 'negociada', 'transferencia', 'credito', 'estorno']).optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type PermutaInput = z.infer<typeof permutaSchema>
export type NegociadaInput = z.infer<typeof negociadaSchema>
export type AvaliarInput = z.infer<typeof avaliarSchema>
export type TransferenciaInput = z.infer<typeof transferenciaSchema>
export type CreditoInput = z.infer<typeof creditoSchema>
export type ListTransactionQuery = z.infer<typeof listTransactionQuerySchema>
