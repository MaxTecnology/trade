import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { saldoSuficienteParaDebito, validarLimiteVenda } from '../../shared/utils/limites.js'
import { queues } from '../queues/bullmq.js'
import type {
  PermutaInput,
  NegociadaInput,
  AvaliarInput,
  TransferenciaInput,
  CreditoInput,
  ListTransactionQuery,
} from './transaction.schema.js'

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
  const limiteCredito = Number(compradorAssociado.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorAssociado.conta.saldo), valorTotal, limiteCredito)) {
    throw Errors.insufficientBalance()
  }

  await validarLimiteVenda({
    contaId: compradorAssociado.conta.id,
    valorNovaOperacao: valorTotal,
    limiteVendaMensal: Number(compradorAssociado.limiteVendaMensal ?? 0),
    limiteVendaTotal: Number(compradorAssociado.limiteVendaTotal ?? 0),
  })

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
        quantidade: input.quantidade,
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

// Negociação direta entre associados, fora do marketplace de ofertas — sempre em RT
// (mesmas validações de saldo/limite de plano da permuta, sem vínculo com Oferta).
export async function negociada(input: NegociadaInput, compradorAssociadoId: string, usuarioId: string) {
  if (input.vendedorId === compradorAssociadoId) {
    throw new AppError('VALIDATION_ERROR', 'Não é possível negociar consigo mesmo.', 422)
  }

  const compradorAssociado = await prisma.associado.findUnique({
    where: { id: compradorAssociadoId },
    include: { plano: true, conta: true },
  })
  if (!compradorAssociado?.conta) throw Errors.notFound('Conta do comprador')
  if (compradorAssociado.status !== 'ativo') throw Errors.associateSuspended()

  const vendedorAssociado = await prisma.associado.findUnique({
    where: { id: input.vendedorId },
    include: { conta: true },
  })
  if (!vendedorAssociado?.conta) throw Errors.notFound('Associado vendedor')
  if (vendedorAssociado.status !== 'ativo') throw Errors.associateSuspended()

  const valorTotal = input.valorRT
  const limiteCreditoComprador = Number(compradorAssociado.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorAssociado.conta.saldo), valorTotal, limiteCreditoComprador)) {
    throw Errors.insufficientBalance()
  }

  await validarLimiteVenda({
    contaId: compradorAssociado.conta.id,
    valorNovaOperacao: valorTotal,
    limiteVendaMensal: Number(compradorAssociado.limiteVendaMensal ?? 0),
    limiteVendaTotal: Number(compradorAssociado.limiteVendaTotal ?? 0),
  })

  const vendedorConta = vendedorAssociado.conta
  const valorParcela = valorTotal / input.parcelas
  const compradorContaSaldo = Number(compradorAssociado.conta.saldo)
  const vendedorContaSaldo = Number(vendedorConta.saldo)
  const comissaoBRL = valorTotal * (Number(compradorAssociado.plano.percentualComissao) / 100)

  const transacao = await prisma.$transaction(async (tx) => {
    const t = await tx.transacao.create({
      data: {
        tipo: 'negociada',
        status: 'concluida',
        valorRT: valorTotal,
        comissaoBRL,
        parcelas: input.parcelas,
        descricao: input.descricao,
        compradorId: compradorAssociadoId,
        vendedorId: input.vendedorId,
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
          descricao: `Negociação direta - parcela ${i}/${input.parcelas}`,
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
          descricao: `Negociação direta - parcela ${i}/${input.parcelas}`,
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

    await tx.voucher.create({
      data: { transacaoId: t.id },
    })

    return t
  })

  await queues.voucherGenerate.add('generate', { transacaoId: transacao.id })
  await queues.commissionCalculate.add('calculate', { transacaoId: transacao.id })
  await queues.commissionGerente.add('gerente', { transacaoId: transacao.id })

  return transacao
}

export async function avaliar(transacaoId: string, input: AvaliarInput, usuarioId: string) {
  const transacao = await prisma.transacao.findUnique({ where: { id: transacaoId } })
  if (!transacao) throw Errors.notFound('Transação')
  if (!['permuta', 'negociada'].includes(transacao.tipo)) {
    throw new AppError('VALIDATION_ERROR', 'Apenas permutas ou negociações podem ser avaliadas.', 422)
  }
  if (transacao.status !== 'concluida') {
    throw new AppError('VALIDATION_ERROR', 'Apenas transações concluídas podem ser avaliadas.', 422)
  }
  if (transacao.usuarioIniciadorId !== usuarioId) {
    throw Errors.forbidden()
  }
  if (transacao.notaAtendimento !== null) {
    throw new AppError('VALIDATION_ERROR', 'Esta transação já foi avaliada.', 422)
  }

  return prisma.transacao.update({
    where: { id: transacaoId },
    data: {
      notaAtendimento: input.notaAtendimento,
      comentarioAvaliacao: input.comentarioAvaliacao,
    },
  })
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
  if (original.tipo !== 'permuta' && original.tipo !== 'negociada') {
    throw new AppError('VALIDATION_ERROR', 'Somente permutas ou negociações podem ser estornadas.', 422)
  }
  if (original.status === 'estornada') {
    throw new AppError('VALIDATION_ERROR', 'Transação já foi estornada.', 422)
  }

  const diasDesde = (Date.now() - original.criadoEm.getTime()) / (1000 * 60 * 60 * 24)
  if (diasDesde > 30) throw Errors.estornoPrazoExpirado()

  const contaOrigem = await prisma.conta.findUnique({ where: { id: original.contaOrigemId! } })
  const contaDestino = await prisma.conta.findUnique({ where: { id: original.contaDestinoId! } })
  if (!contaOrigem || !contaDestino) throw Errors.notFound('Contas da transação')

  // contaDestino recebeu o valor original e é quem será debitado no estorno — se o saldo
  // já foi movimentado (gasto/transferido) desde então, não há RT suficiente para reverter.
  if (Number(contaDestino.saldo) < Number(original.valorRT)) {
    throw Errors.insufficientBalance()
  }

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
      // original.quantidade pode ser null em transações criadas antes deste campo existir
      await tx.oferta.update({
        where: { id: original.ofertaId },
        data: { quantidadeDisponivel: { increment: original.quantidade ?? 1 } },
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
    prisma.transacao.findMany({
      where,
      skip,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: {
        comprador: { select: { nome: true } },
        vendedor: { select: { nome: true } },
        voucher: true,
      },
    }),
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
