import { prisma } from '../../config/prisma.js'
import { TipoMovimentacao } from '@prisma/client'

interface ReportFilters {
  dataInicio?: string
  dataFim?: string
  tipo?: string
  page?: number
  limit?: number
  format?: string
}

function dateRange(dataInicio?: string, dataFim?: string): Record<string, unknown> {
  if (!dataInicio && !dataFim) return {}
  return {
    criadoEm: {
      ...(dataInicio ? { gte: new Date(dataInicio) } : {}),
      ...(dataFim ? { lte: new Date(dataFim) } : {}),
    },
  }
}

export async function extrato(contaId: string, filters: ReportFilters) {
  const page = filters.page ?? 1
  const limit = Math.min(filters.limit ?? 20, 100)
  const skip = (page - 1) * limit

  const where = {
    contaId,
    ...(filters.tipo ? { tipo: filters.tipo as TipoMovimentacao } : {}),
    ...dateRange(filters.dataInicio, filters.dataFim),
  }

  const [movimentacoes, total] = await prisma.$transaction([
    prisma.movimentacaoConta.findMany({
      where,
      skip,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: { transacao: { include: { voucher: true } } },
    }),
    prisma.movimentacaoConta.count({ where }),
  ])

  return { movimentacoes, total, page, limit }
}

export async function saldo(contaId: string) {
  const conta = await prisma.conta.findUnique({ where: { id: contaId }, select: { saldo: true, numero: true } })
  return conta
}

export async function relatorioPermutas(entityId: string, role: string, filters: ReportFilters) {
  const page = filters.page ?? 1
  const limit = Math.min(filters.limit ?? 20, 100)
  const skip = (page - 1) * limit

  let where: Record<string, unknown> = { tipo: 'permuta', ...dateRange(filters.dataInicio, filters.dataFim) }
  if (role === 'associate_admin') {
    where = { ...where, compradorId: entityId }
  } else if (role === 'agency_admin') {
    const associados = await prisma.associado.findMany({
      where: { agenciaId: entityId },
      select: { id: true },
    })
    const ids = associados.map((a) => a.id)
    where = { ...where, OR: [{ compradorId: { in: ids } }, { vendedorId: { in: ids } }] }
  }

  const [items, total] = await prisma.$transaction([
    prisma.transacao.findMany({ where, skip, take: limit, orderBy: { criadoEm: 'desc' } }),
    prisma.transacao.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function relatorioComissoes(entityId: string, role: string, filters: ReportFilters) {
  const page = filters.page ?? 1
  const limit = Math.min(filters.limit ?? 20, 100)
  const skip = (page - 1) * limit

  let where: Record<string, unknown> = {
    tipo: 'permuta',
    comissaoBRL: { not: null },
    ...dateRange(filters.dataInicio, filters.dataFim),
  }

  if (role === 'agency_admin') {
    const associados = await prisma.associado.findMany({
      where: { agenciaId: entityId },
      select: { id: true },
    })
    where = { ...where, compradorId: { in: associados.map((a) => a.id) } }
  }

  const [items, total, soma] = await prisma.$transaction([
    prisma.transacao.findMany({ where, skip, take: limit, orderBy: { criadoEm: 'desc' } }),
    prisma.transacao.count({ where }),
    prisma.transacao.aggregate({ where, _sum: { comissaoBRL: true } }),
  ])

  return { items, total, page, limit, totalComissaoBRL: soma._sum.comissaoBRL ?? 0 }
}

export async function relatorioComissoesGerentes(
  entityId: string,
  role: string,
  filters: ReportFilters,
) {
  const page = filters.page ?? 1
  const limit = Math.min(filters.limit ?? 20, 100)
  const skip = (page - 1) * limit

  const where = {
    ...dateRange(filters.dataInicio, filters.dataFim),
  }

  const [items, total, soma] = await prisma.$transaction([
    prisma.comissaoGerente.findMany({
      where,
      skip,
      take: limit,
      include: { gerente: { select: { nome: true, email: true } } },
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.comissaoGerente.count({ where }),
    prisma.comissaoGerente.aggregate({ where, _sum: { comissaoGerenteBRL: true } }),
  ])

  return { items, total, page, limit, totalComissaoGerenteBRL: soma._sum.comissaoGerenteBRL ?? 0 }
}

export async function relatorioUsoPlanoConta(associadoId: string) {
  const associado = await prisma.associado.findUnique({
    where: { id: associadoId },
    include: { plano: true, conta: true },
  })
  if (!associado) return null

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const usadoMes = await prisma.movimentacaoConta.aggregate({
    where: {
      contaId: associado.conta?.id,
      tipo: 'debito',
      criadoEm: { gte: inicioMes },
    },
    _sum: { valor: true },
  })

  return {
    plano: associado.plano.nome,
    limiteRT: associado.plano.limiteRT,
    usadoMes: usadoMes._sum.valor ?? 0,
    disponivelMes:
      Number(associado.plano.limiteRT) - Number(usadoMes._sum.valor ?? 0),
    periodicidade: associado.plano.periodicidade,
  }
}

export async function relatorioAssociados(requester: { role: string; entityId: string; id: string }, filters: ReportFilters) {
  const page = filters.page ?? 1
  const limit = Math.min(filters.limit ?? 20, 100)
  const skip = (page - 1) * limit

  let where: Record<string, unknown> = {}
  if (requester.role === 'agency_admin') {
    where = { agenciaId: requester.entityId }
  } else if (requester.role === 'gerente') {
    where = { gerenteId: requester.id }
  }

  const [items, total] = await prisma.$transaction([
    prisma.associado.findMany({
      where,
      skip,
      take: limit,
      include: { plano: true, conta: { select: { saldo: true, numero: true } } },
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.associado.count({ where }),
  ])
  return { items, total, page, limit }
}
