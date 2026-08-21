import { FastifyInstance } from 'fastify'
import { authGuard } from '../../shared/guards/auth.guard.js'
import { roleGuard } from '../../shared/guards/role.guard.js'
import {
  createController,
  listController,
  getByIdController,
  updateController,
  changePasswordController,
  resetPasswordController,
  setStatusController,
  removeController,
} from './user.controller.js'

export async function userRoutes(app: FastifyInstance) {
  const adminGuard = { preHandler: [authGuard, roleGuard('associate_admin', 'agency_admin')] }
  const auth = { preHandler: [authGuard] }

  app.post('/usuarios', adminGuard, createController)
  app.get('/usuarios', adminGuard, listController)
  app.get('/usuarios/:id', auth, getByIdController)
  app.put('/usuarios/:id', auth, updateController)
  app.patch('/usuarios/:id/senha', auth, changePasswordController)
  // Reset pelo admin (sem senha atual) — cobre "esqueci a senha", diferente
  // do self-service acima.
  app.patch('/usuarios/:id/senha/redefinir', adminGuard, resetPasswordController)
  app.patch('/usuarios/:id/status', adminGuard, setStatusController)
  app.delete('/usuarios/:id', adminGuard, removeController)
}
