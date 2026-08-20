import { z } from 'zod'

export const SolicitarEstornoSchema = z.object({
  transacaoId: z.string().uuid(),
  // Obrigatório — é o que a Matriz usa pra analisar e decidir aprovar/negar.
  motivo: z.string().trim().min(10, 'Descreva o motivo do estorno (mínimo 10 caracteres).'),
})

export const ListEstornoQuery = z.object({
  status: z.enum(['em_analise', 'encaminhado', 'aprovado', 'negado']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type SolicitarEstornoInput = z.infer<typeof SolicitarEstornoSchema>
export type ListEstornoQueryType = z.infer<typeof ListEstornoQuery>
