import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { Errors } from '../../shared/errors/AppError.js'
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
  criadoEm: true,
}

export async function create(input: CreateManagerInput) {
  const emailExists = await prisma.usuario.findUnique({ where: { email: input.email } })
  if (emailExists) throw Errors.duplicateEmail()

  const senhaHash = await bcrypt.hash(input.senha, env.BCRYPT_SALT_ROUNDS)

  return prisma.usuario.create({
    data: {
      nome: input.nome,
      email: input.email,
      senhaHash,
      role: 'gerente',
      entityType: input.entityType,
      agenciaId: input.entityType === 'agencia' ? input.entityId : null,
      percentualComissao: input.percentualComissao,
    },
    select: managerSelect,
  })
}

export async function list(requester: { role: string; entityId: string }) {
  const where =
    requester.role === 'agency_admin'
      ? { agenciaId: requester.entityId, role: 'gerente' as const }
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
  await getById(id)
  return prisma.usuario.update({
    where: { id },
    data: input,
    select: managerSelect,
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
      _sum: { comissaoGerenteBRL: true },
    }),
  ])

  const totalComissaoBRL = aggregate._sum.comissaoGerenteBRL ?? 0

  return { items, total, totalComissaoBRL }
}
