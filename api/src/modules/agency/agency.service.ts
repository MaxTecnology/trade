import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { gerarNumeroConta } from '../../shared/utils/conta.js'
import type { CreateAgencyInput, UpdateAgencyInput } from './agency.schema.js'

const includeContatos = {
  conta: true,
  contatos: true,
  plano: { select: { id: true, nome: true, percentualComissao: true } },
} as const

export async function create(input: CreateAgencyInput, creatorId: string) {
  const exists = await prisma.agencia.findUnique({ where: { cnpj: input.cnpj } })
  if (exists) throw Errors.duplicateCnpj()

  const emailExists = await prisma.agencia.findUnique({ where: { email: input.email } })
  if (emailExists) throw new AppError('DUPLICATE_EMAIL', 'E-mail de agência já cadastrado.', 409)

  if (input.tipo === 'comum' && !input.agenciaParenteId) {
    throw new AppError('VALIDATION_ERROR', 'Agência comum requer agenciaParenteId.', 400)
  }

  if (input.planoId) {
    const plano = await prisma.plano.findUnique({ where: { id: input.planoId } })
    if (!plano || !plano.ativo) throw Errors.planoInativo()
    if (plano.tipoPlano !== 'agencia') throw new AppError('VALIDATION_ERROR', 'Plano inválido para agência.', 400)
  }

  return prisma.$transaction(async (tx) => {
    const agencia = await tx.agencia.create({
      data: {
        nome: input.nome,
        nomeFantasia: input.nomeFantasia,
        cnpj: input.cnpj,
        inscEstadual: input.inscEstadual,
        inscMunicipal: input.inscMunicipal,
        tipo: input.tipo,
        email: input.email,
        telefone: input.telefone,
        imagemUrl: input.imagemUrl,
        agenciaParenteId: input.agenciaParenteId ?? null,
        planoId: input.planoId ?? null,
        logradouro: input.endereco.logradouro,
        numero: input.endereco.numero,
        complemento: input.endereco.complemento,
        bairro: input.endereco.bairro,
        cidade: input.endereco.cidade,
        estado: input.endereco.estado,
        cep: input.endereco.cep,
        regiao: input.endereco.regiao,
        limiteCredito: input.limiteCredito ?? null,
        limiteVendaMensal: input.limiteVendaMensal ?? null,
        limiteVendaTotal: input.limiteVendaTotal ?? null,
        taxaRepasseMatriz: input.taxaRepasseMatriz ?? null,
        diaVencimentoFatura: input.diaVencimentoFatura ?? null,
      },
    })

    const temContato = input.nomeContato || input.celular || input.emailSecundario
    if (temContato) {
      await tx.contatoAgencia.create({
        data: {
          agenciaId: agencia.id,
          nomeContato: input.nomeContato,
          celular: input.celular,
          emailSecundario: input.emailSecundario,
        },
      })
    }

    const numero = await gerarNumeroConta()
    await tx.conta.create({
      data: { numero, entityType: 'agencia', agenciaId: agencia.id },
    })

    if (input.senha && input.usuarioEmail) {
      const senhaHash = await bcrypt.hash(input.senha, env.BCRYPT_SALT_ROUNDS)
      await tx.usuario.create({
        data: {
          nome: input.usuarioNome ?? input.nome,
          email: input.usuarioEmail,
          cpf: input.usuarioCpf ?? null,
          senhaHash,
          role: 'agency_admin',
          entityType: 'agencia',
          agenciaId: agencia.id,
        },
      })
    } else {
      await tx.usuario.update({
        where: { id: creatorId },
        data: { agenciaId: agencia.id, entityType: 'agencia' },
      })
    }

    return agencia
  })
}

export async function list(requester: { role: string; entityId: string }) {
  const include = includeContatos
  if (requester.role === 'superadmin') {
    return prisma.agencia.findMany({ include, orderBy: { criadoEm: 'desc' } })
  }
  return prisma.agencia.findMany({
    where: { id: requester.entityId },
    include,
    orderBy: { criadoEm: 'desc' },
  })
}

export async function getById(id: string) {
  const agencia = await prisma.agencia.findUnique({ where: { id }, include: includeContatos })
  if (!agencia) throw Errors.notFound('Agência')
  return agencia
}

export async function update(id: string, input: UpdateAgencyInput) {
  const agencia = await getById(id)
  const { nomeContato, celular, emailSecundario, endereco, ...rest } = input

  return prisma.$transaction(async (tx) => {
    const updated = await tx.agencia.update({
      where: { id },
      data: {
        ...rest,
        ...(endereco
          ? {
              logradouro: endereco.logradouro,
              numero: endereco.numero,
              complemento: endereco.complemento,
              bairro: endereco.bairro,
              cidade: endereco.cidade,
              estado: endereco.estado,
              cep: endereco.cep,
              regiao: endereco.regiao,
            }
          : {}),
      },
    })

    const temContato = nomeContato || celular || emailSecundario
    if (temContato) {
      const contatoExistente = agencia.contatos[0]
      if (contatoExistente) {
        await tx.contatoAgencia.update({
          where: { id: contatoExistente.id },
          data: { nomeContato, celular, emailSecundario },
        })
      } else {
        await tx.contatoAgencia.create({
          data: { agenciaId: id, nomeContato, celular, emailSecundario },
        })
      }
    }

    return updated
  })
}

export async function setStatus(id: string, status: 'ativo' | 'suspenso' | 'inativo') {
  await getById(id)
  return prisma.agencia.update({ where: { id }, data: { status } })
}

export async function getAssociados(
  id: string,
  requester: { role: string; id: string },
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit
  const where =
    requester.role === 'gerente'
      ? { agenciaId: id, gerenteId: requester.id }
      : { agenciaId: id }

  const [items, total] = await prisma.$transaction([
    prisma.associado.findMany({ where, skip, take: limit, orderBy: { criadoEm: 'desc' } }),
    prisma.associado.count({ where }),
  ])
  return { items, total }
}

export async function getConta(id: string) {
  const conta = await prisma.conta.findUnique({ where: { agenciaId: id } })
  if (!conta) throw Errors.notFound('Conta')
  return conta
}

export async function getGerentes(id: string) {
  return prisma.usuario.findMany({
    where: { agenciaId: id, role: 'gerente' },
    select: {
      id: true,
      nome: true,
      email: true,
      ativo: true,
      percentualComissao: true,
      criadoEm: true,
    },
  })
}
