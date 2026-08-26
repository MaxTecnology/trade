import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
  SolicitarCreditoSchema,
  AtualizarCreditoSchema,
  FinalizarCreditoSchema,
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
  if (!user.entityId || (user.entityType !== 'associado' && user.entityType !== 'agencia')) throw Errors.forbidden()
  const body = SolicitarCreditoSchema.parse(req.body)
  const data = await solicitarCredito({ entityType: user.entityType, entityId: user.entityId }, body)
  return reply.status(201).send(success(data))
}

export async function meusController(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user
  if (user.entityType !== 'associado' && user.entityType !== 'agencia') throw Errors.forbidden()
  const query = ListCreditoQuery.parse(req.query)
  const result = await listarMeusCreditos({ entityType: user.entityType, entityId: user.entityId }, query)
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
  if (user.entityType !== 'associado' && user.entityType !== 'agencia') throw Errors.forbidden()
  const body = AtualizarCreditoSchema.parse(req.body)
  const data = await atualizarCredito(id, { entityType: user.entityType, entityId: user.entityId }, body)
  return reply.send(success(data))
}

export async function deletarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const user = req.user
  if (user.entityType !== 'associado' && user.entityType !== 'agencia') throw Errors.forbidden()
  await deletarCredito(id, { entityType: user.entityType, entityId: user.entityId })
  return reply.status(204).send()
}

export async function encaminharController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const data = await encaminharCredito(id, req.user)
  return reply.send(success(data))
}

export async function aprovarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const { respostaMatriz } = FinalizarCreditoSchema.parse(req.body)
  const data = await finalizarCredito(id, 'aprovado', respostaMatriz)
  return reply.send(success(data))
}

export async function negarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  const { respostaMatriz } = FinalizarCreditoSchema.parse(req.body)
  const data = await finalizarCredito(id, 'negado', respostaMatriz)
  return reply.send(success(data))
}
