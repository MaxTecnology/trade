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
  // Leitura também precisa ser acessível a quem só visualiza o próprio plano
  // (ex: "Meus Dados" do Associado/Gerente).
  const readRoles = {
    preHandler: [
      authGuard,
      roleGuard('superadmin', 'agency_admin', 'agency_operator', 'associate_admin', 'associate_operator', 'gerente'),
    ],
  }

  app.post('/planos', superadmin, createController)
  app.get('/planos', readRoles, listController)
  app.get('/planos/:id', readRoles, getByIdController)
  app.put('/planos/:id', superadmin, updateController)
  app.patch('/planos/:id/status', superadmin, setStatusController)
}
