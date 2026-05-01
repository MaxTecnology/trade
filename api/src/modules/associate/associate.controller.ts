import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createAssociateSchema,
  updateAssociateSchema,
  statusSchema,
  lojaSchema,
} from './associate.schema.js'
import * as associateService from './associate.service.js'
import { success, paginated } from '../../shared/utils/response.js'

type Params = { id: string }
type Query = { page?: number; limit?: number }

export async function createController(request: FastifyRequest, reply: FastifyReply) {
  const input = createAssociateSchema.parse(request.body)
  const associado = await associateService.create(input)
  return reply.status(201).send(success(associado))
}

export async function listController(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as Query
  const page = Number(q.page ?? 1)
  const limit = Math.min(Number(q.limit ?? 20), 100)
  const { items, total } = await associateService.list(request.user, page, limit)
  return reply.send(paginated(items, page, limit, total))
}

export async function getByIdController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const associado = await associateService.getById(id)
  return reply.send(success(associado))
}

export async function updateController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const input = updateAssociateSchema.parse(request.body)
  const associado = await associateService.update(id, input)
  return reply.send(success(associado))
}

export async function setStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const { status } = statusSchema.parse(request.body)
  const associado = await associateService.setStatus(id, status)
  return reply.send(success(associado))
}

export async function getContaController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const conta = await associateService.getConta(id)
  return reply.send(success(conta))
}

export async function setLojaStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const { statusLoja } = lojaSchema.parse(request.body)
  const associado = await associateService.setLojaStatus(id, statusLoja)
  return reply.send(success(associado))
}
