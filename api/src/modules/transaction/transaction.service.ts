import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { queues } from '../queues/bullmq.js'
import type { PermutaInput, TransferenciaInput, CreditoInput, ListTransactionQuery } from './transaction.schema.js'

export async function permuta(input: PermutaInput, compradorAssociadoId: string, usuarioId: string) {
  const oferta = await prisma.oferta.findUnique({
    where: { id: input.ofertaId },
    include: { associado: { include: { plano: true, conta: true } } },
  })
  if (!oferta || oferta.status !== 'aberta' || oferta.quantidadeDisponivel <= 0) {
    throw Errors.offerUnavailable()
  }

  const compradorAssociado = await prisma.associado.findUnique({
    where: { id: compradorAssociadoId },
    include: { plano: true, conta: true },
  })
  if (!compradorAssociado?.conta) throw Errors.notFound('Conta do comprador')
  if (compradorAssociado.status !== 'ativo') throw Errors.associateSuspended()

  const valorTotal = Number(oferta.valorRT) * input.quantidade
  if (Number(compradorAssociado.conta.saldo) < valorTotal) throw Errors.insufficientBalance()

  // Verificar limite mensal do plano
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const movimentacoesMes = await prisma.movimentacaoConta.aggregate({
    where: {
      contaId: compradorAssociado.conta.id,
      tipo: 'debito',
      criadoEm: { gte: inicioMes },
    },
    _sum: { valor: true },
  })
  const totalMes = Number(movimentacoesMes._sum.valor ?? 0)
  const limiteRT = Number(compradorAssociado.plano.limiteRT)
  if (totalMes + valorTotal > limiteRT) throw Errors.planLimitReached()

const vendedorConta = oferta.associado.conta
  if (!vendedorConta) throw Errors.notFound('Conta do vendedor')

  const valorParcela = valorTotal / input.parcelas
  const compradorContaSaldo = Number(compradorAssociado.conta.saldo)
  const vendedorContaSaldo = Number(vendedorConta.saldo)
  const comissaoBRL = valorTotal * (Number(compradorAssociado.plano.percentualComissao) / 100)

  const transacao = await prisma.$transaction(async (tx) => {
    const t = await tx.transacao.create({
      data: {
        tipo: 'permuta',
        status: 'concluida',
        valorRT: valorTotal,
        comissaoBRL,
        parcelas: input.parcelas,
        compradorId: compradorAssociadoId,
        vendedorId: oferta.associadoId,
        ofertaId: input.ofertaId,
        usuarioIniciadorId: usuarioId,
        contaOrigemId: compradorAssociado.conta!.id,
        contaDestinoId: vendedorConta.id,
      },
    })

    const agora = new Date()
    for (let i = 1; i <= input.parcelas; i++) {
      const vencimento = new Date(agora)
      vencimento.setMonth(vencimento.getMonth() + i - 1)
      const novoSaldoComprador = compradorContaSaldo - valorParcela * i

      await tx.movimentacaoConta.create({
        data: {
          contaId: compradorAssociado.conta!.id,
          tipo: 'debito',
          valor: valorParcela,
          saldoApos: novoSaldoComprador,
          descricao: `Permuta: ${oferta.titulo} - parcela ${i}/${input.parcelas}`,
          transacaoId: t.id,
          numeroParcela: i,
          totalParcelas: input.parcelas,
          vencimento,
        },
      })

      await tx.movimentacaoConta.create({
        data: {
          contaId: vendedorConta.id,
          tipo: 'credito',
          valor: valorParcela,
          saldoApos: vendedorContaSaldo + valorParcela * i,
          descricao: `Permuta: ${oferta.titulo} - parcela ${i}/${input.parcelas}`,
          transacaoId: t.id,
          numeroParcela: i,
          totalParcelas: input.parcelas,
          vencimento,
        },
      })
    }

    await tx.conta.update({
      where: { id: compradorAssociado.conta!.id },
      data: { saldo: { decrement: valorTotal } },
    })

    await tx.conta.update({
      where: { id: vendedorConta.id },
      data: { saldo: { increment: valorTotal } },
    })

    await tx.oferta.update({
      where: { id: input.ofertaId },
      data: { quantidadeDisponivel: { decrement: input.quantidade } },
    })

    await tx.voucher.create({
      data: { transacaoId: t.id },
    })

    return t
  })

  // Jobs assíncronos
  await queues.voucherGenerate.add('generate', { transacaoId: transacao.id })
  await queues.commissionCalculate.add('calculate', { transacaoId: transacao.id })
  await queues.commissionGerente.add('gerente', { transacaoId: transacao.id })

  return transacao
}

export async function transferencia(input: TransferenciaInput, usuarioId: string, contaOrigemId: string) {
  const contaOrigem = await prisma.conta.findUnique({ where: { id: contaOrigemId } })
  if (!contaOrigem || !contaOrigem.ativo) throw Errors.notFound('Conta de origem')
  if (Number(contaOrigem.saldo) < input.valorRT) throw Errors.insufficientBalance()

  const contaDestino = await prisma.conta.findUnique({ where: { id: input.contaDestinoId } })
  if (!contaDestino || !contaDestino.ativo) throw Errors.notFound('Conta de destino')

  return prisma.$transaction(async (tx) => {
    const t = await tx.transacao.create({
      data: {
        tipo: 'transferencia',
        status: 'concluida',
        valorRT: input.valorRT,
        descricao: input.descricao,
        contaOrigemId,
        contaDestinoId: input.contaDestinoId,
        usuarioIniciadorId: usuarioId,
      },
    })

    const novoSaldoOrigem = Number(contaOrigem.saldo) - input.valorRT
    await tx.movimentacaoConta.create({
      data: {
        contaId: contaOrigemId,
        tipo: 'debito',
        valor: input.valorRT,
        saldoApos: novoSaldoOrigem,
        descricao: input.descricao ?? 'Transferência RT',
        transacaoId: t.id,
      },
    })

    const novoSaldoDestino = Number(contaDestino.saldo) + input.valorRT
    await tx.movimentacaoConta.create({
      data: {
        contaId: input.contaDestinoId,
        tipo: 'credito',
        valor: input.valorRT,
        saldoApos: novoSaldoDestino,
        descricao: input.descricao ?? 'Transferência RT',
        transacaoId: t.id,
      },
    })

    await tx.conta.update({ where: { id: contaOrigemId }, data: { saldo: { decrement: input.valorRT } } })
    await tx.conta.update({ where: { id: input.contaDestinoId }, data: { saldo: { increment: input.valorRT } } })

    return t
  })
}

export async function credito(input: CreditoInput, usuarioId: string) {
  const contaDestino = await prisma.conta.findUnique({ where: { id: input.contaDestinoId } })
  if (!contaDestino || !contaDestino.ativo) throw Errors.notFound('Conta de destino')

  return prisma.$transaction(async (tx) => {
    const t = await tx.transacao.create({
      data: {
        tipo: 'credito',
        status: 'concluida',
        valorRT: input.valorRT,
        descricao: input.descricao,
        contaDestinoId: input.contaDestinoId,
        usuarioIniciadorId: usuarioId,
      },
    })

    const novoSaldo = Number(contaDestino.saldo) + input.valorRT
    await tx.movimentacaoConta.create({
      data: {
        contaId: input.contaDestinoId,
        tipo: 'credito',
        valor: input.valorRT,
        saldoApos: novoSaldo,
        descricao: input.descricao ?? 'Injeção de RT pela Matriz',
        transacaoId: t.id,
      },
    })

    await tx.conta.update({ where: { id: input.contaDestinoId }, data: { saldo: { increment: input.valorRT } } })
    return t
  })
}

export async function estorno(transacaoId: string, usuarioId: string) {
  const original = await prisma.transacao.findUnique({
    where: { id: transacaoId },
    include: { oferta: true },
  })
  if (!original) throw Errors.notFound('Transação')
  if (original.tipo !== 'permuta') {
    throw new AppError('VALIDATION_ERROR', 'Somente permutas podem ser estornadas.', 422)
  }
  if (original.status === 'estornada') {
    throw new AppError('VALIDATION_ERROR', 'Transação já foi estornada.', 422)
  }

  const diasDesde = (Date.now() - original.criadoEm.getTime()) / (1000 * 60 * 60 * 24)
  if (diasDesde > 30) throw Errors.estornoPrazoExpirado()

  const contaOrigem = await prisma.conta.findUnique({ where: { id: original.contaOrigemId! } })
  const contaDestino = await prisma.conta.findUnique({ where: { id: original.contaDestinoId! } })
  if (!contaOrigem || !contaDestino) throw Errors.notFound('Contas da transação')

  const transacaoEstorno = await prisma.$transaction(async (tx) => {
    await tx.transacao.update({ where: { id: transacaoId }, data: { status: 'estornada' } })

    const t = await tx.transacao.create({
      data: {
        tipo: 'estorno',
        status: 'concluida',
        valorRT: original.valorRT,
        descricao: `Estorno da transação ${transacaoId}`,
        compradorId: original.compradorId,
        vendedorId: original.vendedorId,
        contaOrigemId: original.contaDestinoId,
        contaDestinoId: original.contaOrigemId,
        transacaoOriginalId: transacaoId,
        usuarioIniciadorId: usuarioId,
      },
    })

    const valorRT = Number(original.valorRT)

    await tx.movimentacaoConta.create({
      data: {
        contaId: original.contaDestinoId!,
        tipo: 'debito',
        valor: valorRT,
        saldoApos: Number(contaDestino.saldo) - valorRT,
        descricao: `Estorno: ${transacaoId}`,
        transacaoId: t.id,
      },
    })

    await tx.movimentacaoConta.create({
      data: {
        contaId: original.contaOrigemId!,
        tipo: 'credito',
        valor: valorRT,
        saldoApos: Number(contaOrigem.saldo) + valorRT,
        descricao: `Estorno: ${transacaoId}`,
        transacaoId: t.id,
      },
    })

    await tx.conta.update({ where: { id: original.contaDestinoId! }, data: { saldo: { decrement: valorRT } } })
    await tx.conta.update({ where: { id: original.contaOrigemId! }, data: { saldo: { increment: valorRT } } })

    if (original.ofertaId) {
      await tx.oferta.update({
        where: { id: original.ofertaId },
        data: { quantidadeDisponivel: { increment: 1 } },
      })
    }

    await tx.voucher.create({ data: { transacaoId: t.id } })
    return t
  })

  await queues.voucherGenerate.add('generate', { transacaoId: transacaoEstorno.id })
  return transacaoEstorno
}

export async function list(query: ListTransactionQuery, contaId: string) {
  const { tipo, dataInicio, dataFim, page, limit } = query
  const skip = (page - 1) * limit

  const where = {
    OR: [{ contaOrigemId: contaId }, { contaDestinoId: contaId }],
    ...(tipo ? { tipo } : {}),
    ...(dataInicio || dataFim
      ? {
          criadoEm: {
            ...(dataInicio ? { gte: new Date(dataInicio) } : {}),
            ...(dataFim ? { lte: new Date(dataFim) } : {}),
          },
        }
      : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.transacao.findMany({ where, skip, take: limit, orderBy: { criadoEm: 'desc' } }),
    prisma.transacao.count({ where }),
  ])
  return { items, total }
}

export async function getById(id: string) {
  const t = await prisma.transacao.findUnique({
    where: { id },
    include: { voucher: true, movimentacoes: true },
  })
  if (!t) throw Errors.notFound('Transação')
  return t
}
