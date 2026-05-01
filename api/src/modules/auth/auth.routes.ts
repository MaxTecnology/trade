import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import {
  loginController,
  refreshController,
  logoutController,
  meController,
} from './auth.controller.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', loginController)
  app.post('/auth/refresh', refreshController)
  app.post('/auth/logout', { preHandler: [authGuard] }, logoutController)
  app.get('/auth/me', { preHandler: [authGuard] }, meController)
}
