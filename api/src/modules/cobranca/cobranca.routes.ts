import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  criarController,
  minhasController,
  todasController,
  quitarController,
  deletarController,
} from './cobranca.controller.js'

export async function cobrancaRoutes(app: FastifyInstance) {
  const auth = { preHandler: [authGuard] }
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }

  app.post('/cobrancas', superadmin, criarController)
  app.get('/cobrancas', superadmin, todasController)
  app.get('/cobrancas/minhas', auth, minhasController)
  app.patch('/cobrancas/:id/quitar', adminOrSuper, quitarController)
  app.delete('/cobrancas/:id', superadmin, deletarController)
}
