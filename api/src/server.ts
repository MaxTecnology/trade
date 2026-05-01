import { buildApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'
import { getRedis } from './config/redis.js'
import { startWorkers } from './modules/queues/bullmq.js'

async function start() {
  const app = await buildApp()

  try {
    await prisma.$connect()
    app.log.info('PostgreSQL conectado.')
  } catch (err) {
    app.log.error({ err }, 'Falha ao conectar ao PostgreSQL')
    process.exit(1)
  }

  try {
    const redis = getRedis()
    await redis.ping()
    app.log.info('Redis conectado.')
  } catch (err) {
    app.log.error({ err }, 'Falha ao conectar ao Redis')
    process.exit(1)
  }

  startWorkers()
  app.log.info('BullMQ workers iniciados.')

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

start()
