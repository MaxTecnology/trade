import { FastifyRequest, FastifyReply } from 'fastify'
import { RoleUsuario } from '@prisma/client'
import { Errors } from '../errors/AppError.js'

export function roleGuard(...roles: RoleUsuario[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || !roles.includes(request.user.role)) {
      const err = Errors.forbidden()
      return reply.status(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message, details: [] },
      })
    }
  }
}
