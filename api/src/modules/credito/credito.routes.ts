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
  const assocOuAgencia = {
    preHandler: [
      authGuard,
      roleGuard('associate_admin', 'associate_operator', 'agency_admin', 'agency_operator'),
    ],
  }
  const agency = { preHandler: [authGuard, roleGuard('agency_admin', 'agency_operator')] }
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }

  // Associado ou Agência — solicitar e gerenciar os próprios créditos
  app.post('/creditos', assocOuAgencia, solicitarController)
  app.get('/creditos/meus', assocOuAgencia, meusController)
  app.put('/creditos/:id', assocOuAgencia, atualizarController)
  app.delete('/creditos/:id', assocOuAgencia, deletarController)

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
