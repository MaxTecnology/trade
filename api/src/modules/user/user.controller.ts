import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  statusSchema,
} from './user.schema.js'
import * as userService from './user.service.js'
import { success } from '../../shared/utils/response.js'

type Params = { id: string }

export async function createController(request: FastifyRequest, reply: FastifyReply) {
  const input = createUserSchema.parse(request.body)
  const u = await userService.create(input)
  return reply.status(201).send(success(u))
}

export async function listController(request: FastifyRequest, reply: FastifyReply) {
  const users = await userService.list(request.user)
  return reply.send(success(users))
}

export async function getByIdController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const u = await userService.getById(id)
  return reply.send(success(u))
}

export async function updateController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const input = updateUserSchema.parse(request.body)
  const u = await userService.update(id, input)
  return reply.send(success(u))
}

export async function changePasswordController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const { senhaAtual, novaSenha } = changePasswordSchema.parse(request.body)
  await userService.changePassword(id, senhaAtual, novaSenha)
  return reply.send(success({ message: 'Senha alterada com sucesso.' }))
}

export async function setStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  const { ativo } = statusSchema.parse(request.body)
  const u = await userService.setStatus(id, ativo)
  return reply.send(success(u))
}

export async function removeController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as Params
  await userService.remove(id)
  return reply.status(204).send()
}
