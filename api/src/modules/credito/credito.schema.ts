import { z } from 'zod'

export const SolicitarCreditoSchema = z.object({
  valorSolicitado: z.number().positive(),
  descricao: z.string().optional(),
})

export const AtualizarCreditoSchema = z.object({
  valorSolicitado: z.number().positive().optional(),
  descricao: z.string().optional(),
})

export const ListCreditoQuery = z.object({
  status: z.enum(['em_analise', 'encaminhado', 'aprovado', 'negado']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type SolicitarCreditoInput = z.infer<typeof SolicitarCreditoSchema>
export type AtualizarCreditoInput = z.infer<typeof AtualizarCreditoSchema>
export type ListCreditoQueryType = z.infer<typeof ListCreditoQuery>
