import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  solicitarController,
  meusController,
  filhosController,
  matrizController,
  todosController,
  atualizarController,
  deletarController,
  encaminharController,
  aprovarController,
  negarController,
} from './credito.controller.js'

export async function creditoRoutes(app: FastifyInstance) {
  const assoc = { preHandler: [authGuard, roleGuard('associate_admin', 'associate_operator')] }
  const agency = { preHandler: [authGuard, roleGuard('agency_admin', 'agency_operator')] }
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }

  // Associado — solicitar e gerenciar os próprios créditos
  app.post('/creditos', assoc, solicitarController)
  app.get('/creditos/meus', assoc, meusController)
  app.put('/creditos/:id', assoc, atualizarController)
  app.delete('/creditos/:id', assoc, deletarController)

  // Agência — ver créditos dos seus associados e encaminhar
  app.get('/creditos/filhos', agency, filhosController)
  app.patch('/creditos/:id/encaminhar', adminOrSuper, encaminharController)

  // Matriz — ver e finalizar créditos encaminhados
  app.get('/creditos/matriz', superadmin, matrizController)
  app.patch('/creditos/:id/aprovar', superadmin, aprovarController)
  app.patch('/creditos/:id/negar', superadmin, negarController)

  // Superadmin — visão geral
  app.get('/creditos', superadmin, todosController)
}
