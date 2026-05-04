import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { Errors } from '../../shared/errors/AppError.js'
import { gerarNumeroConta } from '../../shared/utils/conta.js'
import type { CreateManagerInput, UpdateManagerInput } from './manager.schema.js'

const managerSelect = {
  id: true,
  nome: true,
  email: true,
  role: true,
  ativo: true,
  percentualComissao: true,
  entityType: true,
  agenciaId: true,
  associadoId: true,
  criadoEm: true,
  associado: {
    select: {
      id: true,
      nome: true,
      cnpj: true,
      telefone: true,
      status: true,
      cidade: true,
      estado: true,
      cep: true,
      logradouro: true,
      planoId: true,
      plano: { select: { id: true, nome: true, percentualComissao: true } },
      agencia: { select: { id: true, nome: true } },
      conta: { select: { id: true, numero: true, saldo: true } },
    },
  },
}

export async function create(input: CreateManagerInput) {
  const [cnpjExists, emailAssociado, emailUsuario, plano] = await Promise.all([
    prisma.associado.findUnique({ where: { cnpj: input.cnpj } }),
    prisma.associado.findUnique({ where: { email: input.email } }),
    prisma.usuario.findUnique({ where: { email: input.email } }),
    prisma.plano.findUnique({ where: { id: input.planoId } }),
  ])

  if (cnpjExists) throw Errors.duplicateCnpj()
  if (emailAssociado || emailUsuario) throw Errors.duplicateEmail()
  if (!plano || !plano.ativo) throw Errors.planoInativo()
  if (plano.tipoPlano !== 'gerente') throw Errors.planoInativo()

  if (input.agenciaId) {
    const agencia = await prisma.agencia.findUnique({ where: { id: input.agenciaId } })
    if (!agencia) throw Errors.notFound('Agência')
  }

  return prisma.$transaction(async (tx) => {
    const associado = await tx.associado.create({
      data: {
        nome: input.nome,
        cnpj: input.cnpj,
        email: input.email,
        telefone: input.telefone,
        agenciaId: input.agenciaId ?? null,
        planoId: input.planoId,
        gerenteId: null,
        tipoAtendimento: [],
        logradouro: input.logradouro,
        cidade: input.cidade,
        estado: input.estado,
        cep: input.cep,
      },
    })

    const numero = await gerarNumeroConta()
    await tx.conta.create({
      data: { numero, entityType: 'associado', associadoId: associado.id },
    })

    const senhaHash = await bcrypt.hash(input.senha, env.BCRYPT_SALT_ROUNDS)
    const usuario = await tx.usuario.create({
      data: {
        nome: input.nome,
        email: input.email,
        senhaHash,
        role: 'gerente',
        entityType: 'associado',
        agenciaId: input.agenciaId ?? null,
        associadoId: associado.id,
        percentualComissao: plano.percentualComissao,
      },
      select: managerSelect,
    })

    return usuario
  })
}

export async function list(requester: { role: string; entityId: string }) {
  const where =
    requester.role === 'agency_admin'
      ? { role: 'gerente' as const, agenciaId: requester.entityId }
      : { role: 'gerente' as const }

  return prisma.usuario.findMany({
    where,
    select: managerSelect,
    orderBy: { criadoEm: 'desc' },
  })
}

export async function getById(id: string) {
  const gerente = await prisma.usuario.findFirst({
    where: { id, role: 'gerente' },
    select: managerSelect,
  })
  if (!gerente) throw Errors.notFound('Gerente')
  return gerente
}

export async function update(id: string, input: UpdateManagerInput) {
  const gerente = await getById(id)

  return prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.update({
      where: { id },
      data: {
        ...(input.nome ? { nome: input.nome } : {}),
        ...(input.email ? { email: input.email } : {}),
      },
      select: managerSelect,
    })

    if (input.nome || input.telefone) {
      await tx.associado.update({
        where: { id: gerente.associadoId! },
        data: {
          ...(input.nome ? { nome: input.nome } : {}),
          ...(input.telefone ? { telefone: input.telefone } : {}),
        },
      })
    }

    return usuario
  })
}

export async function setStatus(id: string, ativo: boolean) {
  await getById(id)
  return prisma.usuario.update({
    where: { id },
    data: { ativo },
    select: { id: true, nome: true, ativo: true },
  })
}

export async function getAssociados(id: string, page = 1, limit = 20) {
  await getById(id)
  const skip = (page - 1) * limit
  const [items, total] = await prisma.$transaction([
    prisma.associado.findMany({
      where: { gerenteId: id },
      skip,
      take: limit,
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.associado.count({ where: { gerenteId: id } }),
  ])
  return { items, total }
}

export async function getComissoes(id: string, page = 1, limit = 20) {
  await getById(id)
  const skip = (page - 1) * limit
  const [items, total, aggregate] = await prisma.$transaction([
    prisma.comissaoGerente.findMany({
      where: { gerenteId: id },
      skip,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: {
        transacao: { select: { id: true, tipo: true, valorRT: true, criadoEm: true } },
      },
    }),
    prisma.comissaoGerente.count({ where: { gerenteId: id } }),
    prisma.comissaoGerente.aggregate({
      where: { gerenteId: id },
      _sum: { comissaoRT: true, comissaoBRL: true },
    }),
  ])

  return {
    items,
    total,
    totalComissaoRT: aggregate._sum.comissaoRT ?? 0,
    totalComissaoBRL: aggregate._sum.comissaoBRL ?? 0,
  }
}
