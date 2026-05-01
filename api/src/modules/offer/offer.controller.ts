import { FastifyRequest, FastifyReply } from 'fastify'
import {
  createOfferSchema,
  updateOfferSchema,
  statusSchema,
  listOfferQuerySchema,
} from './offer.schema.js'
import * as offerService from './offer.service.js'
import { success, paginated } from '../../shared/utils/response.js'
import { Errors } from '../../shared/errors/AppError.js'

type Params = { id: string }

export async function createController(request: FastifyRequest, reply: FastifyReply) {
  const input = createOfferSchema.parse(request.body)
  const associadoId = request.user.entityId
  const oferta = await offerService.create(input, associadoId)
  return reply.status(201).send(success(oferta))
}

export async function listController(request: FastifyRequest, reply: FastifyReply) {
  const query = listOfferQuerySchema.parse(request.query)
  const { items, total } = await offerService.list(query)
  return reply.send(paginated(items, query.page, query.limit, total))
}

export async function getByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const oferta = await offerService.getById((request.params as Params).id)
  return reply.send(success(oferta))
}

export async function updateController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const input = updateOfferSchema.parse(request.body)
  const oferta = await offerService.update((request.params as Params).id, input, request.user.entityId)
  return reply.send(success(oferta))
}

export async function setStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { status } = statusSchema.parse(request.body)
  const oferta = await offerService.setStatus((request.params as Params).id, status, request.user.entityId)
  return reply.send(success(oferta))
}

export async function minhaLojaController(request: FastifyRequest, reply: FastifyReply) {
  const page = Number((request.query as { page?: number }).page ?? 1)
  const limit = Math.min(Number((request.query as { limit?: number }).limit ?? 20), 100)
  const { items, total } = await offerService.minhaLoja(request.user.entityId, page, limit)
  return reply.send(paginated(items, page, limit, total))
}
