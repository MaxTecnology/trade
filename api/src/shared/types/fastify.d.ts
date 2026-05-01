import { RoleUsuario, EntityType } from '@prisma/client'

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string
      role: RoleUsuario
      entityType: EntityType
      entityId: string
      contaId?: string
    }
  }
}
