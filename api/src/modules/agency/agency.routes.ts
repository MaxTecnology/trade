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
  getContaController,
  getGerentesController,
} from './agency.controller.js'

export async function agencyRoutes(app: FastifyInstance) {
  const auth = { preHandler: [authGuard] }
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }
  const adminOrGerente = {
    preHandler: [authGuard, roleGuard('superadmin', 'agency_admin', 'gerente')],
  }

  app.post('/agencias', { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }, createController)
  app.get('/agencias', superadmin, listController)
  app.get('/agencias/:id', adminOrSuper, getByIdController)
  app.put('/agencias/:id', adminOrSuper, updateController)
  app.patch('/agencias/:id/status', superadmin, setStatusController)
  app.get('/agencias/:id/associados', adminOrGerente, getAssociadosController)
  app.get('/agencias/:id/conta', { preHandler: [authGuard, roleGuard('agency_admin')] }, getContaController)
  app.get('/agencias/:id/gerentes', adminOrSuper, getGerentesController)
}
