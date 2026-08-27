import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { Errors } from '../../shared/errors/AppError.js'
import { gerarNumeroConta, proximoCodigoOperador } from '../../shared/utils/conta.js'
import { calcularVencimento } from '../../shared/utils/data.js'
import type { CreateAssociateInput, UpdateAssociateInput } from './associate.schema.js'

export async function create(input: CreateAssociateInput) {
  const [cnpjExists, emailExists, plano] = await Promise.all([
    prisma.associado.findUnique({ where: { cnpj: input.cnpj } }),
    prisma.associado.findUnique({ where: { email: input.email } }),
    prisma.plano.findUnique({ where: { id: input.planoId } }),
  ])

  if (cnpjExists) throw Errors.duplicateCnpj()
  if (emailExists) throw Errors.duplicateEmail()
  if (!plano || !plano.ativo) throw Errors.planoInativo()
  if (plano.tipoPlano !== 'associado') throw Errors.planoInativo()

  if (input.gerenteId) {
    const gerente = await prisma.usuario.findUnique({ where: { id: input.gerenteId } })
    if (!gerente || gerente.role !== 'gerente' || !gerente.ativo) throw Errors.gerenteInativo()
  }

  if (input.agenciaId) {
    const agencia = await prisma.agencia.findUnique({ where: { id: input.agenciaId } })
    if (!agencia) throw Errors.notFound('Agência')
  }

  return prisma.$transaction(async (tx) => {
    const associado = await tx.associado.create({
      data: {
        nome: input.nome,
        nomeFantasia: input.nomeFantasia,
        cnpj: input.cnpj,
        email: input.email,
        telefone: input.telefone,
        descricao: input.descricao,
        inscEstadual: input.inscEstadual,
        inscMunicipal: input.inscMunicipal,
        restricao: input.restricao,
        imagemUrl: input.imagemUrl,
        mostrarNoSite: input.mostrarNoSite,
        aceitaOrcamento: input.aceitaOrcamento,
        categoriaId: input.categoriaId ?? null,
        agenciaId: input.agenciaId ?? null,
        gerenteId: input.gerenteId ?? null,
        planoId: input.planoId,
        tipoAtendimento: input.tipoAtendimento,
        tipoOperacao: input.tipoOperacao ?? null,
        formaPagamento: input.formaPagamento ?? null,
        diaVencimentoFatura: input.diaVencimentoFatura ?? null,
        valorInscricaoBRL: input.valorInscricaoBRL ?? null,
        valorInscricaoRT: input.valorInscricaoRT ?? null,
        limiteCredito: input.limiteCredito,
        limiteVendaMensal: input.limiteVendaMensal,
        limiteVendaTotal: input.limiteVendaTotal,
        logradouro: input.logradouro,
        numero: input.numero,
        complemento: input.complemento,
        bairro: input.bairro,
        cidade: input.cidade,
        estado: input.estado,
        cep: input.cep,
        regiao: input.regiao,
      },
    })

    // Contato secundário
    const temContato = input.nomeContato || input.celular || input.emailContato || input.emailSecundario || input.site
    if (temContato) {
      await tx.contatoAssociado.create({
        data: {
          associadoId: associado.id,
          nomeContato: input.nomeContato,
          celular: input.celular,
          emailContato: input.emailContato,
          emailSecundario: input.emailSecundario,
          site: input.site,
        },
      })
    }

    const numero = await gerarNumeroConta()
    const conta = await tx.conta.create({
      data: {
        numero,
        entityType: 'associado',
        associadoId: associado.id,
        limiteCredito: input.limiteCredito,
      },
    })

    const senhaHash = await bcrypt.hash(input.senha, env.BCRYPT_SALT_ROUNDS)
    await tx.usuario.create({
      data: {
        nome: input.nome,
        email: input.email,
        cpf: input.cpf ?? null,
        senhaHash,
        role: 'associate_admin',
        entityType: 'associado',
        agenciaId: input.agenciaId ?? null,
        associadoId: associado.id,
        codigoOperador: proximoCodigoOperador(numero),
      },
    })

    // Cobrança BRL para agência/matriz
    if (input.valorInscricaoBRL && input.valorInscricaoBRL > 0) {
      const vencimento = calcularVencimento(input.diaVencimentoFatura ?? 10)
      await tx.cobranca.create({
        data: {
          descricao: `Inscrição - ${associado.nome}`,
          valorBRL: input.valorInscricaoBRL,
          vencimento,
          contaId: conta.id,
          associadoId: associado.id,
          agenciaId: input.agenciaId ?? null,
          tipo: 'inscricao',
        },
      })
    }

    // Cobrança RT para o associado — nasce JÁ QUITADA: o RT da inscrição é
    // movimentado dentro do próprio sistema (diferente do BRL, liquidado fora
    // e só reconciliado manualmente), então não faz sentido deixar pendente.
    // Fica registrada como Cobrança (pago: true) pra manter o histórico de
    // que aquele débito inicial foi uma cobrança de inscrição, não uma
    // permuta comum. limiteCredito >= valorInscricaoRT é garantido pelo Zod
    // (createAssociateSchema.refine), então o débito nunca viola o CHECK de
    // saldo — associado sempre começa com saldo 0.
    if (input.valorInscricaoRT && input.valorInscricaoRT > 0) {
      const valor = input.valorInscricaoRT
      const vencimento = calcularVencimento(input.diaVencimentoFatura ?? 10)
      const descricaoInscricao = `Inscrição - ${associado.nome}`

      const contaCredora = input.agenciaId
        ? await tx.conta.findUniqueOrThrow({ where: { agenciaId: input.agenciaId } })
        : await tx.conta.findFirstOrThrow({ where: { entityType: 'matriz' } })

      await tx.cobranca.create({
        data: {
          descricao: descricaoInscricao,
          valorRT: valor,
          vencimento,
          contaId: conta.id,
          associadoId: associado.id,
          agenciaId: input.agenciaId ?? null,
          tipo: 'inscricao',
          pago: true,
        },
      })

      await tx.movimentacaoConta.create({
        data: {
          contaId: conta.id,
          tipo: 'debito',
          valor,
          saldoApos: -valor,
          descricao: descricaoInscricao,
        },
      })
      await tx.conta.update({ where: { id: conta.id }, data: { saldo: { decrement: valor } } })

      await tx.movimentacaoConta.create({
        data: {
          contaId: contaCredora.id,
          tipo: 'credito',
          valor,
          saldoApos: Number(contaCredora.saldo) + valor,
          descricao: descricaoInscricao,
        },
      })
      await tx.conta.update({ where: { id: contaCredora.id }, data: { saldo: { increment: valor } } })
    }

    // Comissão de inscrição do gerente — taxaInscricao é R$ (dinheiro real
    // recebido pela Matriz), não RT. baseValorRT aqui guarda um valor em R$
    // (nome do campo é histórico, compartilhado com comissão de transação,
    // que continua sendo RT de verdade).
    if (input.gerenteId && Number(plano.taxaInscricao) > 0) {
      const base = Number(plano.taxaInscricao)
      await tx.comissaoGerente.create({
        data: {
          gerenteId: input.gerenteId,
          associadoId: associado.id,
          transacaoId: null,
          tipoComissao: 'inscricao',
          baseValorRT: base,
          percentual: 50,
          comissaoBRL: base * 0.5,
          comissaoRT: 0,
        },
      })
    }

    return { ...associado, conta }
  })
}

export async function list(requester: { role: string; entityId: string }, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const where = {
    plano: { tipoPlano: { not: 'gerente' as const } },
    ...(requester.role === 'agency_admin' ? { agenciaId: requester.entityId } : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.associado.findMany({
      where,
      skip,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: {
        contatos: true,
        conta: { select: { id: true, numero: true, saldo: true } },
        agencia: { select: { id: true, nome: true } },
        plano: { select: { id: true, nome: true } },
        gerente: { select: { id: true, nome: true } },
        categoria: { select: { id: true, nome: true } },
      },
    }),
    prisma.associado.count({ where }),
  ])

  return { items, total }
}

// Diretório de associados visível a qualquer usuário autenticado (vendedor em
// negociação direta E marketplace público de Associados) — deliberadamente
// sem dados financeiros (saldo, limiteCredito etc.), diferente de list() que
// é uso administrativo e exige role admin/superadmin. `conta` só traz
// `numero` (não sensível, usado como filtro de busca), nunca `saldo`.
// Gerente é tecnicamente um Associado (registro Associado + Usuario role:
// 'gerente', ver CLAUDE.md), mas só pode ser comprador — nunca aparece como
// opção de vendedor nem no marketplace. Filtrado pelo tipoPlano do plano
// vinculado (gerente usa sempre um Plano{tipoPlano:'gerente'}, nunca 'associado').
export async function listDiretorio(exceptAssociadoId?: string) {
  return prisma.associado.findMany({
    where: {
      status: 'ativo',
      plano: { tipoPlano: 'associado' },
      ...(exceptAssociadoId ? { id: { not: exceptAssociadoId } } : {}),
    },
    select: {
      id: true,
      nome: true,
      nomeFantasia: true,
      cidade: true,
      estado: true,
      tipoAtendimento: true,
      status: true,
      descricao: true,
      imagemUrl: true,
      categoriaId: true,
      agenciaId: true,
      contatos: true,
      agencia: { select: { nome: true } },
      gerente: { select: { nome: true } },
      conta: { select: { numero: true } },
    },
    orderBy: { nome: 'asc' },
  })
}

export async function getById(id: string) {
  const associado = await prisma.associado.findUnique({
    where: { id },
    include: {
      contatos: true,
      conta: { select: { id: true, numero: true, saldo: true } },
      agencia: { select: { id: true, nome: true } },
      plano: {
        select: { id: true, nome: true, percentualComissao: true, taxaInscricao: true, taxaManutencaoAnual: true },
      },
      gerente: { select: { id: true, nome: true } },
      categoria: { select: { id: true, nome: true } },
    },
  })
  if (!associado) throw Errors.notFound('Associado')
  return associado
}

export async function update(id: string, input: UpdateAssociateInput) {
  const associado = await getById(id)

  const { nomeContato, celular, emailContato, emailSecundario, site, ...rest } = input

  return prisma.$transaction(async (tx) => {
    const updated = await tx.associado.update({
      where: { id },
      data: rest,
    })

    if (input.limiteCredito !== undefined) {
      const conta = await tx.conta.findUnique({ where: { associadoId: id }, select: { id: true } })
      if (conta) {
        await tx.conta.update({ where: { id: conta.id }, data: { limiteCredito: input.limiteCredito } })
      }
    }

    // Atualiza ou cria contato
    const temContato = nomeContato || celular || emailContato || emailSecundario || site
    if (temContato) {
      const contatoExistente = associado.contatos[0]
      if (contatoExistente) {
        await tx.contatoAssociado.update({
          where: { id: contatoExistente.id },
          data: { nomeContato, celular, emailContato, emailSecundario, site },
        })
      } else {
        await tx.contatoAssociado.create({
          data: { associadoId: id, nomeContato, celular, emailContato, emailSecundario, site },
        })
      }
    }

    return updated
  })
}

export async function setStatus(id: string, status: 'ativo' | 'suspenso' | 'inativo') {
  await getById(id)
  return prisma.associado.update({ where: { id }, data: { status } })
}

export async function getConta(id: string) {
  const conta = await prisma.conta.findUnique({ where: { associadoId: id } })
  if (!conta) throw Errors.notFound('Conta')
  return conta
}

export async function setLojaStatus(id: string, statusLoja: 'aberta' | 'fechada' | 'pausada') {
  await getById(id)
  return prisma.associado.update({ where: { id }, data: { statusLoja } })
}
