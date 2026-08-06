import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from './config/env.js'
import { AppError } from './shared/errors/AppError.js'
import { ZodError } from 'zod'

// Módulos existentes
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

// Novos módulos
import { creditoRoutes } from './modules/credito/credito.routes.js'
import { cobrancaRoutes } from './modules/cobranca/cobranca.routes.js'
import { uploadRoutes } from './modules/upload/upload.routes.js'
import { estornoRoutes } from './modules/estorno/estorno.routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development',
  })

  // Error handler global — precisa ser registrado ANTES de app.register(routes),
  // porque cada plugin registrado via app.register() herda a configuração de erro
  // do pai no momento em que é registrado (encapsulamento do Fastify). Registrar
  // depois faz com que toda rota real (dentro de módulos) nunca herde este handler,
  // caindo no formatter de erro padrão do Fastify — só rotas definidas direto no
  // `app` raiz (fora de qualquer register) herdariam corretamente.
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message, details: error.details },
      })
    }

    // `instanceof ZodError` pode falhar por dual-package hazard (múltiplas instâncias do
    // módulo zod carregadas). Checagem por duck-typing garante a detecção independente disso.
    const isZodError =
      error instanceof ZodError ||
      ((error as { name?: string })?.name === 'ZodError' &&
        Array.isArray((error as { issues?: unknown }).issues))
    if (isZodError) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Erro de validação dos campos.',
          details: (error as { issues: unknown }).issues,
        },
      })
    }

    app.log.error(error)
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.', details: [] },
    })
  })

  app.get('/health', async () => ({ status: 'ok' }))

  await app.register(cookie)
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } })

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
  await app.register(creditoRoutes, { prefix })
  await app.register(cobrancaRoutes, { prefix })
  await app.register(uploadRoutes, { prefix })
  await app.register(estornoRoutes, { prefix })

  return app
}
