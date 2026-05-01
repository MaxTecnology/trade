import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import { getByIdController, getPdfController, verificarController } from './voucher.controller.js'

export async function voucherRoutes(app: FastifyInstance) {
  const operator = { preHandler: [authGuard, roleGuard('associate_operator', 'associate_admin')] }

  app.get('/vouchers/verificar/:codigo', verificarController) // público
  app.get('/vouchers/:id', operator, getByIdController)
  app.get('/vouchers/:id/pdf', operator, getPdfController)
}
