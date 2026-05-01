import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  createController,
  treeController,
  getByIdController,
  updateController,
  setStatusController,
} from './category.controller.js'

export async function categoryRoutes(app: FastifyInstance) {
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }

  app.post('/categorias', superadmin, createController)
  app.get('/categorias', treeController) // público
  app.get('/categorias/:id', getByIdController) // público
  app.put('/categorias/:id', superadmin, updateController)
  app.patch('/categorias/:id/status', superadmin, setStatusController)
}
