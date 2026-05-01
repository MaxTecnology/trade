import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  createController,
  listController,
  getByIdController,
  updateController,
  setStatusController,
  getAssociadosController,
  getComissoesController,
} from './manager.controller.js'

export async function managerRoutes(app: FastifyInstance) {
  const adminOrSuper = {
    preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')],
  }
  const viewManager = {
    preHandler: [authGuard, roleGuard('superadmin', 'agency_admin', 'gerente')],
  }

  app.post('/gerentes', adminOrSuper, createController)
  app.get('/gerentes', adminOrSuper, listController)
  app.get('/gerentes/:id', viewManager, getByIdController)
  app.put('/gerentes/:id', adminOrSuper, updateController)
  app.patch('/gerentes/:id/status', adminOrSuper, setStatusController)
  app.get('/gerentes/:id/associados', viewManager, getAssociadosController)
  app.get('/gerentes/:id/comissoes', viewManager, getComissoesController)
}
