import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  extratoController,
  saldoController,
  permutasController,
  comissoesController,
  comissoesGerentesController,
  usoPlanoConta,
  associadosController,
} from './report.controller.js'

export async function reportRoutes(app: FastifyInstance) {
  const operator = {
    preHandler: [authGuard, roleGuard('associate_operator', 'associate_admin')],
  }
  const assocAdmin = { preHandler: [authGuard, roleGuard('associate_admin')] }
  const agencyOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }
  const adminOrGerente = {
    preHandler: [authGuard, roleGuard('superadmin', 'agency_admin', 'gerente')],
  }

  app.get('/extrato', operator, extratoController)
  app.get('/extrato/saldo', operator, saldoController)
  app.get('/relatorios/permutas', { preHandler: [authGuard, roleGuard('associate_admin', 'agency_admin')] }, permutasController)
  app.get('/relatorios/comissoes', agencyOrSuper, comissoesController)
  app.get('/relatorios/comissoes-gerentes', agencyOrSuper, comissoesGerentesController)
  app.get('/relatorios/uso-plano', assocAdmin, usoPlanoConta)
  app.get('/relatorios/associados', adminOrGerente, associadosController)
}
