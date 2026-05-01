import { z } from 'zod'

export const createUserSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
  role: z.enum(['agency_admin', 'agency_operator', 'associate_admin', 'associate_operator']),
  entityId: z.string().uuid(),
  entityType: z.enum(['agencia', 'associado']),
})

export const updateUserSchema = createUserSchema
  .omit({ senha: true, role: true, entityId: true, entityType: true })
  .partial()

export const changePasswordSchema = z.object({
  senhaAtual: z.string(),
  novaSenha: z.string().min(8),
})

export const statusSchema = z.object({ ativo: z.boolean() })

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
