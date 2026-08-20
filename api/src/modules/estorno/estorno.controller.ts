import { FastifyRequest, FastifyReply } from 'fastify'
import { SolicitarEstornoSchema, ListEstornoQuery } from './estorno.schema.js'
import * as estornoService from './estorno.service.js'
import { success, paginated } from '../../shared/utils/response.js'

type Params = { id: string }

export async function solicitarController(request: FastifyRequest, reply: FastifyReply) {
  const input = SolicitarEstornoSchema.parse(request.body)
  const solicitacao = await estornoService.solicitarEstorno(request.user, input)
  return reply.status(201).send(success(solicitacao))
}

export async function listarMinhasController(request: FastifyRequest, reply: FastifyReply) {
  const query = ListEstornoQuery.parse(request.query)
  const { items, total, page, limit } = await estornoService.listarMinhas(request.user.id, query)
  return reply.send(paginated(items, page, limit, total))
}

export async function listarFilhasController(request: FastifyRequest, reply: FastifyReply) {
  const query = ListEstornoQuery.parse(request.query)
  const { items, total, page, limit } = await estornoService.listarFilhas(
    request.user.entityId,
    query,
    request.user.contaId,
  )
  return reply.send(paginated(items, page, limit, total))
}

export async function listarMatrizController(request: FastifyRequest, reply: FastifyReply) {
  const query = ListEstornoQuery.parse(request.query)
  const { items, total, page, limit } = await estornoService.listarMatriz(query)
  return reply.send(paginated(items, page, limit, total))
}

export async function listarTodasController(request: FastifyRequest, reply: FastifyReply) {
  const query = ListEstornoQuery.parse(request.query)
  const { items, total, page, limit } = await estornoService.listarTodas(query)
  return reply.send(paginated(items, page, limit, total))
}

export async function encaminharController(request: FastifyRequest, reply: FastifyReply) {
  const solicitacao = await estornoService.encaminhar((request.params as Params).id, request.user)
  return reply.send(success(solicitacao))
}

export async function aprovarController(request: FastifyRequest, reply: FastifyReply) {
  const solicitacao = await estornoService.finalizar((request.params as Params).id, 'aprovado', request.user.id)
  return reply.send(success(solicitacao))
}

export async function negarController(request: FastifyRequest, reply: FastifyReply) {
  const solicitacao = await estornoService.finalizar((request.params as Params).id, 'negado', request.user.id)
  return reply.send(success(solicitacao))
}
