import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  extratoController,
  saldoController,
  permutasController,
  permutasMesResumoController,
  fundoPermutaResumoController,
  comissoesController,
  comissoesGerentesController,
  usoPlanoConta,
  associadosController,
  emissaoMatrizController,
} from './report.controller.js'

export async function reportRoutes(app: FastifyInstance) {
  const operator = {
    preHandler: [authGuard, roleGuard('associate_operator', 'associate_admin')],
  }
  // Qualquer conta que compra/vende (Associado, Agência, Matriz) tem extrato
  // próprio — mesmos 5 roles usados em /transacoes/permuta.
  const qualquerConta = {
    preHandler: [
      authGuard,
      roleGuard('associate_operator', 'associate_admin', 'agency_operator', 'agency_admin', 'superadmin'),
    ],
  }
  const assocAdmin = { preHandler: [authGuard, roleGuard('associate_admin')] }
  const agencyOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }
  const adminOrGerente = {
    preHandler: [authGuard, roleGuard('superadmin', 'agency_admin', 'gerente')],
  }
  // Qualquer entidade logada, incluindo Gerente — usado pelos cards
  // Unidade/Geral do dashboard (Permutas Mês, Fundo Permuta), que fazem
  // sentido pra qualquer role autenticada, não só quem administra contas.
  const qualquerContaOuGerente = {
    preHandler: [
      authGuard,
      roleGuard('associate_operator', 'associate_admin', 'agency_operator', 'agency_admin', 'superadmin', 'gerente'),
    ],
  }

  app.get('/extrato', qualquerConta, extratoController)
  app.get('/extrato/saldo', qualquerConta, saldoController)
  app.get(
    '/relatorios/permutas',
    { preHandler: [authGuard, roleGuard('associate_admin', 'agency_admin', 'agency_operator', 'superadmin')] },
    permutasController,
  )
  app.get('/relatorios/permutas-mes', qualquerContaOuGerente, permutasMesResumoController)
  app.get('/relatorios/fundo-permuta', qualquerContaOuGerente, fundoPermutaResumoController)
  app.get('/relatorios/comissoes', agencyOrSuper, comissoesController)
  app.get('/relatorios/comissoes-gerentes', agencyOrSuper, comissoesGerentesController)
  app.get('/relatorios/uso-plano', assocAdmin, usoPlanoConta)
  app.get('/relatorios/associados', adminOrGerente, associadosController)
  app.get('/relatorios/emissao-matriz', { preHandler: [authGuard, roleGuard('superadmin')] }, emissaoMatrizController)
}
