import { FastifyRequest, FastifyReply } from 'fastify'
import * as voucherService from './voucher.service.js'
import { success } from '../../shared/utils/response.js'

export async function getByIdController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const voucher = await voucherService.getById(id)
  return reply.send(success(voucher))
}

export async function getPdfController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const pdf = await voucherService.getPdf(id)
  return reply.send(success(pdf))
}

export async function verificarController(request: FastifyRequest, reply: FastifyReply) {
  const { codigo } = request.params as { codigo: string }
  const voucher = await voucherService.verificar(codigo)
  return reply.send(success(voucher))
}
