import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  createController,
  listController,
  getByIdController,
  updateController,
  setStatusController,
  minhaLojaController,
} from './offer.controller.js'

export async function offerRoutes(app: FastifyInstance) {
  const operatorGuard = {
    preHandler: [authGuard, roleGuard('associate_admin', 'associate_operator')],
  }

  app.post('/ofertas', operatorGuard, createController)
  app.get('/ofertas', listController) // público
  app.get('/ofertas/minha-loja', operatorGuard, minhaLojaController)
  app.get('/ofertas/:id', getByIdController) // público
  app.put('/ofertas/:id', operatorGuard, updateController)
  app.patch('/ofertas/:id/status', operatorGuard, setStatusController)
}
