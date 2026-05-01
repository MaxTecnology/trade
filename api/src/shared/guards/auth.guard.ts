import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { Errors } from '../errors/AppError.js'
import { RoleUsuario, EntityType } from '@prisma/client'

interface JwtPayload {
  sub: string
  role: RoleUsuario
  entityType: EntityType
  entityId: string
  contaId?: string
}

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    const err = Errors.unauthorized()
    return reply.status(err.statusCode).send({
      success: false,
      error: { code: err.code, message: err.message, details: [] },
    })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    request.user = {
      id: payload.sub,
      role: payload.role,
      entityType: payload.entityType,
      entityId: payload.entityId,
      contaId: payload.contaId,
    }
  } catch {
    const err = Errors.unauthorized()
    return reply.status(err.statusCode).send({
      success: false,
      error: { code: err.code, message: err.message, details: [] },
    })
  }
}
