import { FastifyRequest, FastifyReply } from 'fastify'
import { createPlanSchema, updatePlanSchema, statusSchema } from './plan.schema.js'
import * as planService from './plan.service.js'
import { success } from '../../shared/utils/response.js'

export async function createController(request: FastifyRequest, reply: FastifyReply) {
  const input = createPlanSchema.parse(request.body)
  const plano = await planService.create(input)
  return reply.status(201).send(success(plano))
}

export async function listController(_request: FastifyRequest, reply: FastifyReply) {
  const planos = await planService.list()
  return reply.send(success(planos))
}

export async function getByIdController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const plano = await planService.getById(id)
  return reply.send(success(plano))
}

export async function updateController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const input = updatePlanSchema.parse(request.body)
  const plano = await planService.update(id, input)
  return reply.send(success(plano))
}

export async function setStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const { ativo } = statusSchema.parse(request.body)
  const plano = await planService.setStatus(id, ativo)
  return reply.send(success(plano))
}
