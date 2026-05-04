import type { FastifyRequest, FastifyReply } from 'fastify'
import { CriarCobrancaSchema, ListCobrancaQuery } from './cobranca.schema.js'
import {
  criarCobranca,
  listarCobrancasPorAssociado,
  listarCobrancasPorAgencia,
  listarTodasCobrancas,
  quitarCobranca,
  deletarCobranca,
} from './cobranca.service.js'
import { success, paginated } from '../../shared/utils/response.js'
import { Errors } from '../../shared/errors/AppError.js'

export async function criarController(req: FastifyRequest, reply: FastifyReply) {
  const body = CriarCobrancaSchema.parse(req.body)
  const data = await criarCobranca(body)
  return reply.status(201).send(success(data))
}

export async function minhasController(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user
  const query = ListCobrancaQuery.parse(req.query)
  if (user.entityType === 'associado') {
    const result = await listarCobrancasPorAssociado(user.entityId, query)
    return reply.send(paginated(result.items, result.page, result.limit, result.total))
  }
  if (user.entityType === 'agencia') {
    const result = await listarCobrancasPorAgencia(user.entityId, query)
    return reply.send(paginated(result.items, result.page, result.limit, result.total))
  }
  throw Errors.forbidden()
}

export async function todasController(req: FastifyRequest, reply: FastifyReply) {
  const query = ListCobrancaQuery.parse(req.query)
  const result = await listarTodasCobrancas(query)
  return reply.send(paginated(result.items, result.page, result.limit, result.total))
}

export async function quitarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await quitarCobranca(id)
  return reply.send(success(data))
}

export async function deletarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  await deletarCobranca(id)
  return reply.status(204).send()
}
