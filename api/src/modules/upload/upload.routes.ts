import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import { uploadController, deletarController } from './upload.controller.js'

export async function uploadRoutes(app: FastifyInstance) {
  const auth = { preHandler: [authGuard] }
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }

  app.post('/upload', auth, uploadController)
  app.delete('/upload/:id', superadmin, deletarController)
}
