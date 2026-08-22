import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { saldoSuficienteParaDebito, validarLimiteVenda, getLimiteCreditoDaConta } from '../../shared/utils/limites.js'
import { queues } from '../queues/bullmq.js'
import type {
  PermutaInput,
  NegociadaInput,
  AvaliarInput,
  TransferenciaInput,
  CreditoInput,
  ListTransactionQuery,
} from './transaction.schema.js'

const compradorContaInclude = {
  associado: { include: { plano: true } },
  agencia: { include: { plano: true } },
} satisfies Prisma.ContaInclude

type CompradorConta = Prisma.ContaGetPayload<{ include: typeof compradorContaInclude }>

/**
 * Valida se o comprador pode operar (Associado/Agência suspensos são
 * barrados) e resolve o percentual de comissão da plataforma, que sempre
 * vem do plano de quem compra. Matriz não tem plano — cai no `return 0`
 * (sem comissão de plataforma pra si mesma). Usado por permuta() e
 * negociada(), único ponto de resolução do comprador entre as duas.
 */
function resolverComissaoComprador(compradorConta: CompradorConta): number {
  if (compradorConta.entityType === 'associado') {
    if (!compradorConta.associado) throw Errors.notFound('Associado')
    if (compradorConta.associado.status !== 'ativo') throw Errors.associateSuspended()
    return Number(compradorConta.associado.plano.percentualComissao)
  }
  if (compradorConta.entityType === 'agencia') {
    if (!compradorConta.agencia) throw Errors.notFound('Agência')
    if (compradorConta.agencia.status !== 'ativo') throw Errors.agencySuspended()
    return Number(compradorConta.agencia.plano?.percentualComissao ?? 0)
  }
  return 0
}

export async function permuta(input: PermutaInput, compradorContaId: string, usuarioId: string) {
  const oferta = await prisma.oferta.findUnique({
    where: { id: input.ofertaId },
    include: { conta: { include: { associado: true, agencia: true } } },
  })
  if (!oferta || oferta.status !== 'aberta' || oferta.quantidadeDisponivel <= 0) {
    throw Errors.offerUnavailable()
  }

  const compradorConta = await prisma.conta.findUnique({
    where: { id: compradorContaId },
    include: compradorContaInclude,
  })
  if (!compradorConta) throw Errors.notFound('Conta do comprador')

  const percentualComissao = resolverComissaoComprador(compradorConta)

  const valorTotal = Number(oferta.valorRT) * input.quantidade
  const limiteCredito = Number(compradorConta.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorConta.saldo), valorTotal, limiteCredito)) {
    throw Errors.insufficientBalance()
  }

  const vendedorConta = oferta.conta
  if (!vendedorConta) throw Errors.notFound('Conta do vendedor')

  if (compradorConta.id === vendedorConta.id) {
    throw new AppError('VALIDATION_ERROR', 'Não é possível comprar a própria oferta.', 422)
  }

  // Limite de venda é do lado de quem VENDE (recebe RT) — quem compra já é
  // limitado por saldo + limiteCredito, não precisa de teto de volume extra.
  let limiteVendaMensalVendedor = 0
  let limiteVendaTotalVendedor = 0
  let pularValidacaoLimiteVenda = vendedorConta.entityType === 'matriz'
  if (vendedorConta.entityType === 'associado') {
    if (!vendedorConta.associado) throw Errors.notFound('Associado vendedor')
    limiteVendaMensalVendedor = Number(vendedorConta.associado.limiteVendaMensal ?? 0)
    limiteVendaTotalVendedor = Number(vendedorConta.associado.limiteVendaTotal ?? 0)
  } else if (vendedorConta.entityType === 'agencia') {
    if (!vendedorConta.agencia) throw Errors.notFound('Agência vendedora')
    // Mesma regra de null da Agência compradora (ver histórico): agency.service.ts
    // não exige limiteVendaMensal/Total no cadastro, então null é "sem teto
    // configurado ainda", não "zerado por esquecimento".
    if (vendedorConta.agencia.limiteVendaMensal === null || vendedorConta.agencia.limiteVendaTotal === null) {
      pularValidacaoLimiteVenda = true
    } else {
      limiteVendaMensalVendedor = Number(vendedorConta.agencia.limiteVendaMensal)
      limiteVendaTotalVendedor = Number(vendedorConta.agencia.limiteVendaTotal)
    }
  }

  if (!pularValidacaoLimiteVenda) {
    await validarLimiteVenda({
      contaId: vendedorConta.id,
      valorNovaOperacao: valorTotal,
      limiteVendaMensal: limiteVendaMensalVendedor,
      limiteVendaTotal: limiteVendaTotalVendedor,
    })
  }

  const valorParcela = valorTotal / input.parcelas
  const compradorContaSaldo = Number(compradorConta.saldo)
  const vendedorContaSaldo = Number(vendedorConta.saldo)
  const comissaoBRL = valorTotal * (percentualComissao / 100)

  const transacao = await prisma.$transaction(async (tx) => {
    const t = await tx.transacao.create({
      data: {
        tipo: 'permuta',
        status: 'concluida',
        valorRT: valorTotal,
        comissaoBRL,
        parcelas: input.parcelas,
        quantidade: input.quantidade,
        compradorId: compradorConta.associado?.id ?? null,
        vendedorId: oferta.associadoId,
        ofertaId: input.ofertaId,
        usuarioIniciadorId: usuarioId,
        contaOrigemId: compradorConta.id,
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
          contaId: compradorConta.id,
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
      where: { id: compradorConta.id },
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
export async function negociada(input: NegociadaInput, compradorContaId: string, usuarioId: string) {
  const compradorConta = await prisma.conta.findUnique({
    where: { id: compradorContaId },
    include: compradorContaInclude,
  })
  if (!compradorConta) throw Errors.notFound('Conta do comprador')

  if (compradorConta.entityType === 'associado' && input.vendedorTipo === 'associado' && input.vendedorId === compradorConta.associadoId) {
    throw new AppError('VALIDATION_ERROR', 'Não é possível negociar consigo mesmo.', 422)
  }

  const percentualComissao = resolverComissaoComprador(compradorConta)

  // Resolução genérica do vendedor — mesma lógica de permuta() (Associado,
  // Agência ou Matriz), só que partindo de vendedorId+vendedorTipo em vez de
  // uma oferta (negociada() é fora do marketplace, não tem oferta no meio).
  let vendedorConta: { id: string; saldo: unknown; entityType: string }
  let vendedorAssociadoId: string | null = null
  let limiteVendaMensalVendedor = 0
  let limiteVendaTotalVendedor = 0
  let pularValidacaoLimiteVenda = false

  if (input.vendedorTipo === 'agencia') {
    const vendedorAgencia = await prisma.agencia.findUnique({
      where: { id: input.vendedorId },
      include: { conta: true },
    })
    if (!vendedorAgencia?.conta) throw Errors.notFound('Agência vendedora')
    if (vendedorAgencia.status !== 'ativo') throw Errors.agencySuspended()
    vendedorConta = vendedorAgencia.conta
    // Mesma regra de null usada em permuta(): agency.service.ts não exige
    // limiteVendaMensal/Total no cadastro — null é "sem teto configurado
    // ainda", não "zerado por esquecimento".
    if (vendedorAgencia.limiteVendaMensal === null || vendedorAgencia.limiteVendaTotal === null) {
      pularValidacaoLimiteVenda = true
    } else {
      limiteVendaMensalVendedor = Number(vendedorAgencia.limiteVendaMensal)
      limiteVendaTotalVendedor = Number(vendedorAgencia.limiteVendaTotal)
    }
  } else if (input.vendedorTipo === 'matriz') {
    vendedorConta = await prisma.conta.findFirstOrThrow({ where: { entityType: 'matriz' } })
    pularValidacaoLimiteVenda = true
  } else {
    const vendedorAssociado = await prisma.associado.findUnique({
      where: { id: input.vendedorId },
      include: { conta: true },
    })
    if (!vendedorAssociado?.conta) throw Errors.notFound('Associado vendedor')
    if (vendedorAssociado.status !== 'ativo') throw Errors.associateSuspended()
    vendedorConta = vendedorAssociado.conta
    vendedorAssociadoId = vendedorAssociado.id
    limiteVendaMensalVendedor = Number(vendedorAssociado.limiteVendaMensal ?? 0)
    limiteVendaTotalVendedor = Number(vendedorAssociado.limiteVendaTotal ?? 0)
  }

  if (compradorConta.id === vendedorConta.id) {
    throw new AppError('VALIDATION_ERROR', 'Não é possível negociar consigo mesmo.', 422)
  }

  const valorTotal = input.valorRT
  const limiteCreditoComprador = Number(compradorConta.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorConta.saldo), valorTotal, limiteCreditoComprador)) {
    throw Errors.insufficientBalance()
  }

  // Limite de venda é do lado de quem VENDE (recebe RT) — quem compra já é
  // limitado por saldo + limiteCredito, não precisa de teto de volume extra.
  if (!pularValidacaoLimiteVenda) {
    await validarLimiteVenda({
      contaId: vendedorConta.id,
      valorNovaOperacao: valorTotal,
      limiteVendaMensal: limiteVendaMensalVendedor,
      limiteVendaTotal: limiteVendaTotalVendedor,
    })
  }

  const valorParcela = valorTotal / input.parcelas
  const compradorContaSaldo = Number(compradorConta.saldo)
  const vendedorContaSaldo = Number(vendedorConta.saldo)
  const comissaoBRL = valorTotal * (percentualComissao / 100)

  const transacao = await prisma.$transaction(async (tx) => {
    const t = await tx.transacao.create({
      data: {
        tipo: 'negociada',
        status: 'concluida',
        valorRT: valorTotal,
        comissaoBRL,
        parcelas: input.parcelas,
        descricao: input.descricao,
        compradorId: compradorConta.associado?.id ?? null,
        vendedorId: vendedorAssociadoId,
        usuarioIniciadorId: usuarioId,
        contaOrigemId: compradorConta.id,
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
          contaId: compradorConta.id,
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
      where: { id: compradorConta.id },
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
  const limiteCreditoOrigem = await getLimiteCreditoDaConta(contaOrigemId)
  if (!saldoSuficienteParaDebito(Number(contaOrigem.saldo), input.valorRT, limiteCreditoOrigem)) {
    throw Errors.insufficientBalance()
  }

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
        // Última solicitação de estorno, pra UI mostrar "Estorno em análise" etc.
        // mesmo com transacao.status ainda concluida (só vira 'estornada' quando
        // a Matriz de fato aprova).
        solicitacoesEstorno: { select: { status: true }, orderBy: { criadoEm: 'desc' }, take: 1 },
        usuarioIniciador: { select: { nome: true, codigoOperador: true } },
      },
    }),
    prisma.transacao.count({ where }),
  ])
  return { items, total }
}

export async function getById(id: string, contaId: string) {
  const t = await prisma.transacao.findUnique({
    where: { id },
    include: {
      voucher: true,
      movimentacoes: true,
      usuarioIniciador: { select: { nome: true, codigoOperador: true } },
      solicitacoesEstorno: { select: { status: true }, orderBy: { criadoEm: 'desc' }, take: 1 },
    },
  })
  if (!t || (t.contaOrigemId !== contaId && t.contaDestinoId !== contaId)) {
    throw Errors.notFound('Transação')
  }
  return t
}
