import { FastifyRequest, FastifyReply } from 'fastify'
import { createCategorySchema, updateCategorySchema, statusSchema } from './category.schema.js'
import * as categoryService from './category.service.js'
import { success } from '../../shared/utils/response.js'

export async function createController(request: FastifyRequest, reply: FastifyReply) {
  const input = createCategorySchema.parse(request.body)
  const cat = await categoryService.create(input)
  return reply.status(201).send(success(cat))
}

export async function treeController(_request: FastifyRequest, reply: FastifyReply) {
  const cats = await categoryService.tree()
  return reply.send(success(cats))
}

export async function getByIdController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const cat = await categoryService.getById(id)
  return reply.send(success(cat))
}

export async function updateController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const input = updateCategorySchema.parse(request.body)
  const cat = await categoryService.update(id, input)
  return reply.send(success(cat))
}

export async function setStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const { ativo } = statusSchema.parse(request.body)
  const cat = await categoryService.setStatus(id, ativo)
  return reply.send(success(cat))
}
