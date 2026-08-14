import { FastifyRequest, FastifyReply } from 'fastify'
import { updateLimiteCreditoSchema } from './matriz.schema.js'
import * as matrizService from './matriz.service.js'
import { success } from '../../shared/utils/response.js'

export async function updateLimiteCreditoController(request: FastifyRequest, reply: FastifyReply) {
  const input = updateLimiteCreditoSchema.parse(request.body)
  const conta = await matrizService.updateLimiteCredito(input)
  return reply.send(success(conta))
}
