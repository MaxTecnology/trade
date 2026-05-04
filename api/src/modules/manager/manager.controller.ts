import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createManagerSchema,
  updateManagerSchema,
  statusSchema,
} from './manager.schema.js'
import * as managerService from './manager.service.js'
import { success, paginated } from '../../shared/utils/response.js'

type Params = { id: string }
type Query = { page?: number; limit?: number }

export async function createController(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as Record<string, unknown>
  // agency_admin sempre usa sua própria agência
  if (request.user.role === 'agency_admin') {
    body.agenciaId = request.user.entityId
  }
  // string vazia = gerente da matriz (sem agência)
  if (body.agenciaId === '' || body.agenciaId === null) {
    delete body.agenciaId
  }
  const input = createManagerSchema.parse(body)
  const gerente = await managerService.create(input)
  return reply.status(201).send(success(gerente))
}

export async function listController(request: FastifyRequest, reply: FastifyReply) {
  const gerentes = await managerService.list(request.user)
  return reply.send(success(gerentes))
}

export async function getByIdController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const gerente = await managerService.getById(id)
  return reply.send(success(gerente))
}

export async function updateController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const input = updateManagerSchema.parse(request.body)
  const gerente = await managerService.update(id, input)
  return reply.send(success(gerente))
}

export async function setStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const { ativo } = statusSchema.parse(request.body)
  const gerente = await managerService.setStatus(id, ativo)
  return reply.send(success(gerente))
}

export async function getAssociadosController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const q = request.query as Query
  const page = Number(q.page ?? 1)
  const limit = Math.min(Number(q.limit ?? 20), 100)
  const { items, total } = await managerService.getAssociados(id, page, limit)
  return reply.send(paginated(items, page, limit, total))
}

export async function getComissoesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const q = request.query as Query
  const page = Number(q.page ?? 1)
  const limit = Math.min(Number(q.limit ?? 20), 100)
  const result = await managerService.getComissoes(id, page, limit)
  return reply.send(success(result))
}
