import { z } from 'zod'

export const SolicitarEstornoSchema = z.object({
  transacaoId: z.string().uuid(),
  motivo: z.string().optional(),
})

export const ListEstornoQuery = z.object({
  status: z.enum(['em_analise', 'encaminhado', 'aprovado', 'negado']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type SolicitarEstornoInput = z.infer<typeof SolicitarEstornoSchema>
export type ListEstornoQueryType = z.infer<typeof ListEstornoQuery>
