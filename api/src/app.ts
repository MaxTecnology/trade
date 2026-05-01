import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from './config/env.js'
import { AppError } from './shared/errors/AppError.js'
import { ZodError } from 'zod'

// Módulos
import { authRoutes } from './modules/auth/auth.routes.js'
import { agencyRoutes } from './modules/agency/agency.routes.js'
import { associateRoutes } from './modules/associate/associate.routes.js'
import { userRoutes } from './modules/user/user.routes.js'
import { managerRoutes } from './modules/manager/manager.routes.js'
import { planRoutes } from './modules/plan/plan.routes.js'
import { categoryRoutes } from './modules/category/category.routes.js'
import { offerRoutes } from './modules/offer/offer.routes.js'
import { transactionRoutes } from './modules/transaction/transaction.routes.js'
import { voucherRoutes } from './modules/voucher/voucher.routes.js'
import { reportRoutes } from './modules/report/report.routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development',
  })

  await app.register(cookie)

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Rede Trade API',
        description: 'API do sistema de permuta Rede Trade',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })

  await app.register(swaggerUi, { routePrefix: '/docs' })

  // Rotas
  const prefix = env.API_PREFIX
  await app.register(authRoutes, { prefix })
  await app.register(agencyRoutes, { prefix })
  await app.register(associateRoutes, { prefix })
  await app.register(userRoutes, { prefix })
  await app.register(managerRoutes, { prefix })
  await app.register(planRoutes, { prefix })
  await app.register(categoryRoutes, { prefix })
  await app.register(offerRoutes, { prefix })
  await app.register(transactionRoutes, { prefix })
  await app.register(voucherRoutes, { prefix })
  await app.register(reportRoutes, { prefix })

  // Error handler global
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message, details: error.details },
      })
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Erro de validação dos campos.',
          details: error.issues,
        },
      })
    }

    app.log.error(error)
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.', details: [] },
    })
  })

  return app
}
