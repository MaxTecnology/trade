import { FastifyRequest, FastifyReply } from 'fastify'
import * as reportService from './report.service.js'
import { success, paginated } from '../../shared/utils/response.js'
import { Errors } from '../../shared/errors/AppError.js'

type Query = {
  dataInicio?: string
  dataFim?: string
  tipo?: string
  page?: number
  limit?: number
  format?: string
}

export async function extratoController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user.contaId) throw Errors.forbidden()
  const query = request.query as Query
  const result = await reportService.extrato(request.user.contaId, query)

  if (query.format === 'csv') {
    const csv = [
      'id,tipo,valor,saldoApos,descricao,criadoEm',
      ...result.movimentacoes.map((m) =>
        [m.id, m.tipo, m.valor, m.saldoApos, m.descricao ?? '', m.criadoEm.toISOString()].join(','),
      ),
    ].join('\n')
    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="extrato.csv"')
      .send(csv)
  }

  return reply.send(paginated(result.movimentacoes, result.page, result.limit, result.total))
}

export async function saldoController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user.contaId) throw Errors.forbidden()
  const saldo = await reportService.saldo(request.user.contaId)
  return reply.send(success(saldo))
}

export async function permutasController(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as Query
  const result = await reportService.relatorioPermutas(request.user.entityId, request.user.role, q)
  return reply.send(paginated(result.items, result.page, result.limit, result.total))
}

export async function comissoesController(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as Query
  const result = await reportService.relatorioComissoes(request.user.entityId, request.user.role, q)
  return reply.send({
    ...paginated(result.items, result.page, result.limit, result.total),
    totalComissaoBRL: result.totalComissaoBRL,
  })
}

export async function comissoesGerentesController(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as Query
  const result = await reportService.relatorioComissoesGerentes(request.user.entityId, request.user.role, q)
  return reply.send({
    ...paginated(result.items, result.page, result.limit, result.total),
    totalComissaoGerenteBRL: result.totalComissaoGerenteBRL,
  })
}

export async function usoPlanoConta(request: FastifyRequest, reply: FastifyReply) {
  const result = await reportService.relatorioUsoPlanoConta(request.user.entityId)
  return reply.send(success(result))
}

export async function associadosController(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as Query
  const result = await reportService.relatorioAssociados(request.user, q)
  return reply.send(paginated(result.items, result.page, result.limit, result.total))
}
