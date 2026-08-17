import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  createController,
  listController,
  diretorioController,
  getByIdController,
  updateController,
  setStatusController,
  getContaController,
  setLojaStatusController,
} from './associate.controller.js'

export async function associateRoutes(app: FastifyInstance) {
  const agencyAdmin = { preHandler: [authGuard, roleGuard('agency_admin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }
  const viewAssociate = {
    preHandler: [authGuard, roleGuard('superadmin', 'agency_admin', 'associate_admin')],
  }
  const associateAdmin = { preHandler: [authGuard, roleGuard('associate_admin')] }
  const operator = {
    preHandler: [authGuard, roleGuard('associate_admin', 'associate_operator')],
  }
  // Diretório também é usado pelo filtro "Associado" em Extratos (Agência/Matriz),
  // além do uso original (Associado escolhendo parceiro pra negociação direta).
  const diretorioRoles = {
    preHandler: [
      authGuard,
      roleGuard(
        'associate_admin',
        'associate_operator',
        'agency_admin',
        'agency_operator',
        'superadmin',
      ),
    ],
  }
  const contaRoles = {
    preHandler: [authGuard, roleGuard('superadmin', 'agency_admin', 'associate_admin')],
  }

  app.post('/associados', adminOrSuper, createController)
  app.get('/associados', adminOrSuper, listController)
  // Diretório mínimo (sem dados financeiros) para negociação direta entre associados —
  // precisa vir antes de /associados/:id para não ser capturada como um :id.
  app.get('/associados/diretorio', diretorioRoles, diretorioController)
  app.get('/associados/:id', viewAssociate, getByIdController)
  app.put('/associados/:id', viewAssociate, updateController)
  app.patch('/associados/:id/status', adminOrSuper, setStatusController)
  app.get('/associados/:id/conta', contaRoles, getContaController)
  app.patch('/associados/:id/loja', associateAdmin, setLojaStatusController)
}
