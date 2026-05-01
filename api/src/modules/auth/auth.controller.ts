import { FastifyRequest, FastifyReply } from 'fastify'
import { loginSchema } from './auth.schema.js'
import * as authService from './auth.service.js'
import { success } from '../../shared/utils/response.js'
import { Errors } from '../../shared/errors/AppError.js'

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const input = loginSchema.parse(request.body)
  const result = await authService.login(input)

  reply.setCookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60,
  })

  return reply.send(success({ accessToken: result.accessToken, usuario: result.usuario }))
}

export async function refreshController(request: FastifyRequest, reply: FastifyReply) {
  const refreshToken = request.cookies?.refreshToken
  if (!refreshToken) throw Errors.unauthorized()
  const result = await authService.refresh(refreshToken)
  return reply.send(success(result))
}

export async function logoutController(request: FastifyRequest, reply: FastifyReply) {
  const refreshToken = request.cookies?.refreshToken
  if (refreshToken) await authService.logout(refreshToken)
  reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' })
  return reply.send(success({ message: 'Sessão encerrada.' }))
}

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  const usuario = await authService.me(request.user.id)
  return reply.send(success(usuario))
}
