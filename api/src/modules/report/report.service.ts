import { prisma } from '../../config/prisma.js'
import { TipoMovimentacao } from '@prisma/client'
import { inicioMesBrasilia } from '../../shared/utils/limites.js'

interface ReportFilters {
  dataInicio?: string
  dataFim?: string
  tipo?: string
  page?: number
  limit?: number
  format?: string
}

function dateRange(dataInicio?: string, dataFim?: string, campo = 'criadoEm'): Record<string, unknown> {
  if (!dataInicio && !dataFim) return {}
  return {
    [campo]: {
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
      include: {
        transacao: {
          include: {
            voucher: true,
            solicitacoesEstorno: { select: { status: true }, orderBy: { criadoEm: 'desc' }, take: 1 },
            comprador: { select: { id: true, nome: true, agenciaId: true } },
            vendedor: { select: { id: true, nome: true, agenciaId: true } },
            contaOrigem: { select: { entityType: true, agenciaId: true, agencia: { select: { nome: true } } } },
            contaDestino: { select: { entityType: true, agenciaId: true, agencia: { select: { nome: true } } } },
            usuarioIniciador: { select: { nome: true, codigoOperador: true } },
          },
        },
      },
    }),
    prisma.movimentacaoConta.count({ where }),
  ])

  return { movimentacoes, total, page, limit }
}

export async function saldo(contaId: string) {
  const conta = await prisma.conta.findUnique({
    where: { id: contaId },
    select: { saldo: true, numero: true, limiteCredito: true },
  })
  return conta
}

// "Unidade" = eu + meu grupo hierárquico (mesma regra dos cards Associados/
// Ofertas/Fundo Permuta do dashboard): Matriz conta ela mesma + associados
// sem agência; Agência conta ela mesma + seus próprios associados; Associado
// conta os colegas da mesma agência (ou colegas diretos da Matriz, se ele
// também não tem agência). "Geral" é sempre o total do sistema, sem nenhuma
// restrição — acessível pra qualquer role autenticada.
export async function resumoPermutasMes(requester: {
  role: string
  entityType: string
  entityId: string
}) {
  const inicioMes = inicioMesBrasilia()
  const baseWhere = {
    tipo: { in: ['permuta' as const, 'negociada' as const] },
    status: 'concluida' as const,
    criadoEm: { gte: inicioMes },
  }

  let grupoWhere: Record<string, unknown>
  if (requester.role === 'superadmin') {
    grupoWhere = {
      OR: [
        { contaOrigem: { entityType: 'matriz' as const } },
        { contaDestino: { entityType: 'matriz' as const } },
        { contaOrigem: { entityType: 'associado' as const, associado: { agenciaId: null } } },
        { contaDestino: { entityType: 'associado' as const, associado: { agenciaId: null } } },
      ],
    }
  } else if (requester.entityType === 'agencia') {
    grupoWhere = {
      OR: [
        { contaOrigem: { entityType: 'agencia' as const, agenciaId: requester.entityId } },
        { contaDestino: { entityType: 'agencia' as const, agenciaId: requester.entityId } },
        { contaOrigem: { entityType: 'associado' as const, associado: { agenciaId: requester.entityId } } },
        { contaDestino: { entityType: 'associado' as const, associado: { agenciaId: requester.entityId } } },
      ],
    }
  } else {
    const associado = await prisma.associado.findUnique({
      where: { id: requester.entityId },
      select: { agenciaId: true },
    })
    const minhaAgenciaId = associado?.agenciaId ?? null
    grupoWhere = {
      OR: [
        { contaOrigem: { entityType: 'associado' as const, associado: { agenciaId: minhaAgenciaId } } },
        { contaDestino: { entityType: 'associado' as const, associado: { agenciaId: minhaAgenciaId } } },
      ],
    }
  }

  const [geralAgg, unidadeAgg] = await Promise.all([
    prisma.transacao.aggregate({ where: baseWhere, _sum: { valorRT: true } }),
    prisma.transacao.aggregate({ where: { ...baseWhere, ...grupoWhere }, _sum: { valorRT: true } }),
  ])

  return {
    unidade: Number(unidadeAgg._sum?.valorRT ?? 0),
    geral: Number(geralAgg._sum?.valorRT ?? 0),
  }
}

// Fundo de Permutas = limite de crédito liberado às agências, associados e
// gerentes (excluídos aqui — sempre têm limiteCredito null/0, comissão não é
// crédito). Mesma regra hierárquica de resumoPermutasMes: "Geral" é o total
// do sistema sem restrição; "Unidade" é eu + meu grupo. Gerente cai no ramo
// de associado comum (é um Associado, ver AJUSTES.md), sua própria
// agenciaId decide o grupo do mesmo jeito.
export async function resumoFundoPermuta(requester: {
  role: string
  entityType: string
  entityId: string
}) {
  const naoGerente = { plano: { tipoPlano: { not: 'gerente' as const } } }

  const [agenciasAgg, associadosAgg] = await Promise.all([
    prisma.agencia.aggregate({ _sum: { limiteCredito: true } }),
    prisma.associado.aggregate({ where: naoGerente, _sum: { limiteCredito: true } }),
  ])
  const geral = Number(agenciasAgg._sum.limiteCredito ?? 0) + Number(associadosAgg._sum.limiteCredito ?? 0)

  let unidade: number
  if (requester.role === 'superadmin') {
    const diretosAgg = await prisma.associado.aggregate({
      where: { ...naoGerente, agenciaId: null },
      _sum: { limiteCredito: true },
    })
    unidade = Number(agenciasAgg._sum.limiteCredito ?? 0) + Number(diretosAgg._sum.limiteCredito ?? 0)
  } else if (requester.entityType === 'agencia') {
    const meusAgg = await prisma.associado.aggregate({
      where: { ...naoGerente, agenciaId: requester.entityId },
      _sum: { limiteCredito: true },
    })
    unidade = Number(meusAgg._sum.limiteCredito ?? 0)
  } else {
    const associado = await prisma.associado.findUnique({
      where: { id: requester.entityId },
      select: { agenciaId: true },
    })
    const minhaAgenciaId = associado?.agenciaId ?? null
    const grupoAgg = await prisma.associado.aggregate({
      where: { ...naoGerente, agenciaId: minhaAgenciaId },
      _sum: { limiteCredito: true },
    })
    unidade = Number(grupoAgg._sum.limiteCredito ?? 0)
  }

  return { unidade, geral }
}

export async function relatorioPermutas(
  entityId: string,
  role: string,
  filters: ReportFilters,
  contaId?: string,
) {
  const page = filters.page ?? 1
  const limit = Math.min(filters.limit ?? 20, 100)
  const skip = (page - 1) * limit

  // Sem filters.tipo, mostra todos os tipos de transação (visão geral de
  // extrato) — passar tipo explicitamente (ex: 'permuta') filtra só esse tipo.
  let where: Record<string, unknown> = {
    ...(filters.tipo ? { tipo: filters.tipo } : {}),
    ...dateRange(filters.dataInicio, filters.dataFim),
  }
  if (role === 'associate_admin') {
    where = { ...where, compradorId: entityId }
  } else if (role === 'agency_admin') {
    const associados = await prisma.associado.findMany({
      where: { agenciaId: entityId },
      select: { id: true },
    })
    const ids = associados.map((a) => a.id)
    // Cobre tanto os associados da agência (via compradorId/vendedorId) quanto
    // a própria agência participando diretamente (via contaOrigemId/contaDestinoId,
    // já que Transacao.compradorId/vendedorId só são preenchidos pra Associado).
    const condicoes: Record<string, unknown>[] = [
      { compradorId: { in: ids } },
      { vendedorId: { in: ids } },
    ]
    if (contaId) condicoes.push({ contaOrigemId: contaId }, { contaDestinoId: contaId })
    where = { ...where, OR: condicoes }
  }

  const [items, total] = await prisma.$transaction([
    prisma.transacao.findMany({
      where,
      skip,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: {
        // agenciaId aqui: qual agência GERENCIA o associado comprador/vendedor
        // (Associado.agenciaId). contaOrigem/contaDestino.agenciaId cobrem o
        // caso da própria Agência ser a parte direta (sem Associado no meio).
        comprador: { select: { id: true, nome: true, agenciaId: true } },
        vendedor: { select: { id: true, nome: true, agenciaId: true } },
        contaOrigem: { select: { entityType: true, agenciaId: true, agencia: { select: { nome: true } } } },
        contaDestino: { select: { entityType: true, agenciaId: true, agencia: { select: { nome: true } } } },
        solicitacoesEstorno: { select: { status: true }, orderBy: { criadoEm: 'desc' }, take: 1 },
        usuarioIniciador: { select: { nome: true, codigoOperador: true } },
      },
    }),
    prisma.transacao.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function relatorioComissoes(
  entityId: string,
  role: string,
  filters: ReportFilters,
  contaId?: string,
) {
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
    // Comissão é sempre cobrada de quem compra — cobre os associados da
    // agência (compradorId) e a própria agência comprando direto (contaOrigemId).
    const condicoes: Record<string, unknown>[] = [{ compradorId: { in: associados.map((a) => a.id) } }]
    if (contaId) condicoes.push({ contaOrigemId: contaId })
    where = { ...where, OR: condicoes }
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
    prisma.comissaoGerente.aggregate({ where, _sum: { comissaoBRL: true } }),
  ])

  return { items, total, page, limit, totalComissaoGerenteBRL: soma._sum?.comissaoBRL ?? 0 }
}

export async function relatorioUsoPlanoConta(associadoId: string) {
  const associado = await prisma.associado.findUnique({
    where: { id: associadoId },
    include: { plano: true, conta: true },
  })
  if (!associado) return null

  const inicioMes = inicioMesBrasilia()

  // limiteVendaMensal limita quanto o associado pode VENDER (receber em
  // crédito) por mês, não quanto ele compra/gasta.
  const usadoMes = await prisma.movimentacaoConta.aggregate({
    where: {
      contaId: associado.conta?.id,
      tipo: 'credito',
      criadoEm: { gte: inicioMes },
    },
    _sum: { valor: true },
  })

  return {
    plano: associado.plano.nome,
    limiteVendaMensal: associado.limiteVendaMensal,
    usadoMes: usadoMes._sum.valor ?? 0,
    disponivelMes:
      Number(associado.limiteVendaMensal ?? 0) - Number(usadoMes._sum.valor ?? 0),
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

/**
 * Relatório de emissão de RT da Matriz — unifica os caminhos que criam ou
 * destroem RT no sistema (nenhum tinha visibilidade unificada antes):
 * 1) injeção direta (POST /transacoes/credito, Transacao sem contaOrigemId)
 * 2) queima (Cobranca em RT quitada — a perna de crédito sempre cai na Matriz
 *    quando não tem agência, mas o valor ainda sai de circulação do lado do devedor)
 * 3) compra da Matriz no mercado normal (permuta/negociada com ela como compradora)
 *    — informativo: é zero-soma no total (débito dela, crédito do vendedor), não
 *    entra no líquido, mas mostra o quanto ela está "girando" o próprio limite.
 *
 * `limiteAprovado` (SolicitacaoCredito aprovada) é só informativo, igual
 * `compraMatriz` — desde a decisão de produto de 2026-08-26, aprovar crédito
 * aumenta `limiteCredito` (teto de quanto pode ficar negativo), não injeta
 * saldo — não cria RT nenhum na aprovação, só quando o associado de fato
 * compra usando esse limite (contabilizado normalmente como permuta/negociada).
 *
 * circulacaoAtual = SUM(saldo) das contas != matriz, sempre instantâneo (ignora
 * o filtro de período) — soma de todo RT que já existe, criado e não destruído.
 */
export async function relatorioEmissaoMatriz(filters: { dataInicio?: string; dataFim?: string }) {
  const contaMatriz = await prisma.conta.findFirstOrThrow({ where: { entityType: 'matriz' } })

  const [circulacaoAgg, injecaoAgg, limiteAprovadoAgg, queimaAgg, compraMatrizAgg] = await Promise.all([
    prisma.conta.aggregate({
      where: { entityType: { not: 'matriz' } },
      _sum: { saldo: true },
    }),
    prisma.transacao.aggregate({
      where: { tipo: 'credito', contaOrigemId: null, ...dateRange(filters.dataInicio, filters.dataFim) },
      _sum: { valorRT: true },
      _count: true,
    }),
    prisma.solicitacaoCredito.aggregate({
      where: { status: 'aprovado', ...dateRange(filters.dataInicio, filters.dataFim, 'atualizadoEm') },
      _sum: { valorSolicitado: true },
      _count: true,
    }),
    prisma.cobranca.aggregate({
      where: {
        pago: true,
        valorRT: { not: null },
        agenciaId: null,
        ...dateRange(filters.dataInicio, filters.dataFim, 'atualizadoEm'),
      },
      _sum: { valorRT: true },
      _count: true,
    }),
    prisma.transacao.aggregate({
      where: {
        tipo: { in: ['permuta', 'negociada'] },
        contaOrigemId: contaMatriz.id,
        ...dateRange(filters.dataInicio, filters.dataFim),
      },
      _sum: { valorRT: true },
      _count: true,
    }),
  ])

  const injecaoDireta = { total: Number(injecaoAgg._sum.valorRT ?? 0), quantidade: injecaoAgg._count }
  const limiteAprovado = {
    total: Number(limiteAprovadoAgg._sum.valorSolicitado ?? 0),
    quantidade: limiteAprovadoAgg._count,
  }
  const queima = { total: Number(queimaAgg._sum.valorRT ?? 0), quantidade: queimaAgg._count }
  const compraMatriz = { total: Number(compraMatrizAgg._sum.valorRT ?? 0), quantidade: compraMatrizAgg._count }

  return {
    circulacaoAtual: Number(circulacaoAgg._sum.saldo ?? 0),
    periodo: { dataInicio: filters.dataInicio ?? null, dataFim: filters.dataFim ?? null },
    injecaoDireta,
    limiteAprovado,
    queima,
    compraMatriz,
    emissaoLiquida: injecaoDireta.total - queima.total,
  }
}
