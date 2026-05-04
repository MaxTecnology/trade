import { z } from 'zod'

export const CriarCobrancaSchema = z.object({
  contaId: z.string().uuid(),
  associadoId: z.string().uuid().optional(),
  agenciaId: z.string().uuid().optional(),
  valorBRL: z.number().positive(),
  vencimento: z.string().datetime(),
  descricao: z.string().optional(),
})

export const ListCobrancaQuery = z.object({
  pago: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CriarCobrancaInput = z.infer<typeof CriarCobrancaSchema>
export type ListCobrancaQueryType = z.infer<typeof ListCobrancaQuery>
