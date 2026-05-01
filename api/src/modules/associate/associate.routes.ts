import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  createController,
  listController,
  getByIdController,
  updateController,
  setStatusController,
  getContaController,
  setLojaStatusController,
} from './associate.controller.js'

export async function associateRoutes(app: FastifyInstance) {
  const agencyAdmin = { preHandler: [authGuard, roleGuard('agency_admin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }
  const viewAssociate = {
    preHandler: [authGuard, roleGuard('superadmin', 'agency_admin', 'associate_admin')],
  }
  const associateAdmin = { preHandler: [authGuard, roleGuard('associate_admin')] }
  const contaRoles = {
    preHandler: [authGuard, roleGuard('superadmin', 'agency_admin', 'associate_admin')],
  }

  app.post('/associados', agencyAdmin, createController)
  app.get('/associados', adminOrSuper, listController)
  app.get('/associados/:id', viewAssociate, getByIdController)
  app.put('/associados/:id', associateAdmin, updateController)
  app.patch('/associados/:id/status', agencyAdmin, setStatusController)
  app.get('/associados/:id/conta', contaRoles, getContaController)
  app.patch('/associados/:id/loja', associateAdmin, setLojaStatusController)
}
