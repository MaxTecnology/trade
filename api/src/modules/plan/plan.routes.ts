import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  createController,
  listController,
  getByIdController,
  updateController,
  setStatusController,
} from './plan.controller.js'

export async function planRoutes(app: FastifyInstance) {
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }

  app.post('/planos', superadmin, createController)
  app.get('/planos', adminOrSuper, listController)
  app.get('/planos/:id', adminOrSuper, getByIdController)
  app.put('/planos/:id', superadmin, updateController)
  app.patch('/planos/:id/status', superadmin, setStatusController)
}
