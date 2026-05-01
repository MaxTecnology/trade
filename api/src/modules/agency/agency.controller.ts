import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createAgencySchema,
  updateAgencySchema,
  statusSchema,
} from './agency.schema.js'
import * as agencyService from './agency.service.js'
import { success, paginated } from '../../shared/utils/response.js'

type Params = { id: string }
type Query = { page?: number; limit?: number }

export async function createController(request: FastifyRequest, reply: FastifyReply) {
  const input = createAgencySchema.parse(request.body)
  const agencia = await agencyService.create(input, request.user.id)
  return reply.status(201).send(success(agencia))
}

export async function listController(request: FastifyRequest, reply: FastifyReply) {
  const agencias = await agencyService.list(request.user)
  return reply.send(success(agencias))
}

export async function getByIdController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const agencia = await agencyService.getById(id)
  return reply.send(success(agencia))
}

export async function updateController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const input = updateAgencySchema.parse(request.body)
  const agencia = await agencyService.update(id, input)
  return reply.send(success(agencia))
}

export async function setStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const { status } = statusSchema.parse(request.body)
  const agencia = await agencyService.setStatus(id, status)
  return reply.send(success(agencia))
}

export async function getAssociadosController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const q = request.query as Query
  const page = Number(q.page ?? 1)
  const limit = Math.min(Number(q.limit ?? 20), 100)
  const { items, total } = await agencyService.getAssociados(id, request.user, page, limit)
  return reply.send(paginated(items, page, limit, total))
}

export async function getContaController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const conta = await agencyService.getConta(id)
  return reply.send(success(conta))
}

export async function getGerentesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const gerentes = await agencyService.getGerentes(id)
  return reply.send(success(gerentes))
}
