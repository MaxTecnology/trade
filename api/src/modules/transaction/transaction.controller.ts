import { FastifyRequest, FastifyReply } from 'fastify'
import {
  permutaSchema,
  transferenciaSchema,
  creditoSchema,
  listTransactionQuerySchema,
} from './transaction.schema.js'
import * as txService from './transaction.service.js'
import { success, paginated } from '../../shared/utils/response.js'
import { Errors } from '../../shared/errors/AppError.js'

type Params = { id: string }

export async function permutaController(request: FastifyRequest, reply: FastifyReply) {
  const input = permutaSchema.parse(request.body)
  const t = await txService.permuta(input, request.user.entityId, request.user.id)
  return reply.status(201).send(success(t))
}

export async function transferenciaController(request: FastifyRequest, reply: FastifyReply) {
  const input = transferenciaSchema.parse(request.body)
  if (!request.user.contaId) throw Errors.forbidden()
  const t = await txService.transferencia(input, request.user.id, request.user.contaId)
  return reply.status(201).send(success(t))
}

export async function creditoController(request: FastifyRequest, reply: FastifyReply) {
  const input = creditoSchema.parse(request.body)
  const t = await txService.credito(input, request.user.id)
  return reply.status(201).send(success(t))
}

export async function estornoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const t = await txService.estorno((request.params as Params).id, request.user.id)
  return reply.send(success(t))
}

export async function listController(request: FastifyRequest, reply: FastifyReply) {
  const query = listTransactionQuerySchema.parse(request.query)
  if (!request.user.contaId) throw Errors.forbidden()
  const { items, total } = await txService.list(query, request.user.contaId)
  return reply.send(paginated(items, query.page, query.limit, total))
}

export async function getByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const t = await txService.getById((request.params as Params).id)
  return reply.send(success(t))
}
