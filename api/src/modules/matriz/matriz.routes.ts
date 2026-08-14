import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import { updateLimiteCreditoController } from './matriz.controller.js'

export async function matrizRoutes(app: FastifyInstance) {
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }

  app.patch('/matriz/limite-credito', superadmin, updateLimiteCreditoController)
}
