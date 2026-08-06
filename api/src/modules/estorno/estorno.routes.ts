import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  solicitarController,
  listarMinhasController,
  listarFilhasController,
  listarMatrizController,
  listarTodasController,
  encaminharController,
  aprovarController,
  negarController,
} from './estorno.controller.js'

export async function estornoRoutes(app: FastifyInstance) {
  const solicitante = {
    preHandler: [
      authGuard,
      roleGuard('associate_admin', 'associate_operator', 'agency_admin', 'superadmin'),
    ],
  }
  const agency = { preHandler: [authGuard, roleGuard('agency_admin', 'agency_operator')] }
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }

  app.post('/estornos', solicitante, solicitarController)
  app.get('/estornos/minhas', solicitante, listarMinhasController)

  app.get('/estornos/filhos', agency, listarFilhasController)
  app.patch('/estornos/:id/encaminhar', adminOrSuper, encaminharController)

  app.get('/estornos/matriz', superadmin, listarMatrizController)
  app.patch('/estornos/:id/aprovar', superadmin, aprovarController)
  app.patch('/estornos/:id/negar', superadmin, negarController)

  app.get('/estornos', superadmin, listarTodasController)
}
