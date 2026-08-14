import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  permutaController,
  negociadaController,
  avaliarController,
  transferenciaController,
  creditoController,
  estornoController,
  listController,
  getByIdController,
} from './transaction.controller.js'

export async function transactionRoutes(app: FastifyInstance) {
  const comprador = {
    preHandler: [
      authGuard,
      roleGuard('associate_operator', 'associate_admin', 'agency_operator', 'agency_admin', 'superadmin'),
    ],
  }
  const assocAdmin = { preHandler: [authGuard, roleGuard('associate_admin')] }
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }
  const auth = { preHandler: [authGuard] }

  app.post('/transacoes/permuta', comprador, permutaController)
  app.post('/transacoes/negociada', comprador, negociadaController)
  app.patch('/transacoes/:id/avaliar', comprador, avaliarController)
  app.post('/transacoes/transferencia', assocAdmin, transferenciaController)
  app.post('/transacoes/credito', superadmin, creditoController)
  app.post('/transacoes/:id/estorno', adminOrSuper, estornoController)
  app.get('/transacoes', comprador, listController)
  app.get('/transacoes/:id', comprador, getByIdController)
}
