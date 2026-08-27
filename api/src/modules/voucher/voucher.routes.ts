import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import { getByIdController, getPdfController, verificarController } from './voucher.controller.js'

export async function voucherRoutes(app: FastifyInstance) {
  // Sem checagem de dono aqui — quem participou (ou é da agência/matriz
  // participante) é resolvido em voucher.service.ts::podeVer, senão 404.
  const operator = {
    preHandler: [
      authGuard,
      roleGuard('associate_operator', 'associate_admin', 'agency_admin', 'agency_operator', 'superadmin'),
    ],
  }

  app.get('/vouchers/verificar/:codigo', verificarController) // público
  app.get('/vouchers/:id', operator, getByIdController)
  app.get('/vouchers/:id/pdf', operator, getPdfController)
}
