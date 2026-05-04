import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { Errors } from '../../shared/errors/AppError.js'
import { gerarNumeroConta } from '../../shared/utils/conta.js'
import type { CreateAssociateInput, UpdateAssociateInput } from './associate.schema.js'

function calcularVencimento(dia: number): Date {
  const hoje = new Date()
  let vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), dia)
  if (vencimento <= hoje) {
    vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia)
  }
  return vencimento
}

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
        limiteCredito: input.limiteCredito ?? null,
        limiteVendaMensal: input.limiteVendaMensal ?? null,
        limiteVendaTotal: input.limiteVendaTotal ?? null,
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
      data: { numero, entityType: 'associado', associadoId: associado.id },
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
        },
      })
    }

    // Débito RT na conta do associado (saldo inicia negativo)
    if (input.valorInscricaoRT && input.valorInscricaoRT > 0) {
      const saldoApos = -input.valorInscricaoRT
      await tx.movimentacaoConta.create({
        data: {
          contaId: conta.id,
          tipo: 'debito',
          valor: input.valorInscricaoRT,
          saldoApos,
          descricao: 'Inscrição - Permuta',
        },
      })
      await tx.conta.update({
        where: { id: conta.id },
        data: { saldo: saldoApos },
      })
    }

    // Comissão de inscrição do gerente
    if (input.gerenteId && Number(plano.taxaInscricaoRT) > 0) {
      const base = Number(plano.taxaInscricaoRT)
      await tx.comissaoGerente.create({
        data: {
          gerenteId: input.gerenteId,
          associadoId: associado.id,
          transacaoId: null,
          tipoComissao: 'inscricao',
          baseValorRT: base,
          percentual: 50,
          comissaoBRL: base * 0.25,
          comissaoRT: base * 0.25,
        },
      })
    }

    return { ...associado, conta }
  })
}

export async function list(requester: { role: string; entityId: string }, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const where = requester.role === 'agency_admin' ? { agenciaId: requester.entityId } : {}

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

export async function getById(id: string) {
  const associado = await prisma.associado.findUnique({
    where: { id },
    include: {
      contatos: true,
      conta: { select: { id: true, numero: true, saldo: true } },
      agencia: { select: { id: true, nome: true } },
      plano: { select: { id: true, nome: true } },
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
