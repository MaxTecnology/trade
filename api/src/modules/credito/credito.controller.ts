import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
  SolicitarCreditoSchema,
  AtualizarCreditoSchema,
  ListCreditoQuery,
} from './credito.schema.js'
import {
  solicitarCredito,
  listarMeusCreditos,
  listarCreditosFilhos,
  listarCreditosMatriz,
  listarTodosCreditos,
  atualizarCredito,
  deletarCredito,
  encaminharCredito,
  finalizarCredito,
} from './credito.service.js'
import { success, paginated } from '../../shared/utils/response.js'
import { Errors } from '../../shared/errors/AppError.js'

export async function solicitarController(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user
  if (!user.entityId || user.entityType !== 'associado') throw Errors.forbidden()
  const body = SolicitarCreditoSchema.parse(req.body)
  const data = await solicitarCredito(user.entityId, body)
  return reply.status(201).send(success(data))
}

export async function meusController(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user
  if (user.entityType !== 'associado') throw Errors.forbidden()
  const query = ListCreditoQuery.parse(req.query)
  const result = await listarMeusCreditos(user.entityId, query)
  return reply.send(paginated(result.items, result.page, result.limit, result.total))
}

export async function filhosController(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user
  if (user.entityType !== 'agencia') throw Errors.forbidden()
  const query = ListCreditoQuery.parse(req.query)
  const result = await listarCreditosFilhos(user.entityId, query)
  return reply.send(paginated(result.items, result.page, result.limit, result.total))
}

export async function matrizController(req: FastifyRequest, reply: FastifyReply) {
  const query = ListCreditoQuery.parse(req.query)
  const result = await listarCreditosMatriz(query)
  return reply.send(paginated(result.items, result.page, result.limit, result.total))
}

export async function todosController(req: FastifyRequest, reply: FastifyReply) {
  const query = ListCreditoQuery.parse(req.query)
  const result = await listarTodosCreditos(query)
  return reply.send(paginated(result.items, result.page, result.limit, result.total))
}

export async function atualizarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const user = req.user
  if (user.entityType !== 'associado') throw Errors.forbidden()
  const body = AtualizarCreditoSchema.parse(req.body)
  const data = await atualizarCredito(id, user.entityId, body)
  return reply.send(success(data))
}

export async function deletarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const user = req.user
  if (user.entityType !== 'associado') throw Errors.forbidden()
  await deletarCredito(id, user.entityId)
  return reply.status(204).send()
}

export async function encaminharController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await encaminharCredito(id)
  return reply.send(success(data))
}

export async function aprovarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await finalizarCredito(id, 'aprovado')
  return reply.send(success(data))
}

export async function negarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await finalizarCredito(id, 'negado')
  return reply.send(success(data))
}
