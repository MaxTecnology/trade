import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { gerarNumeroConta } from '../../shared/utils/conta.js'
import type { CreateAssociateInput, UpdateAssociateInput } from './associate.schema.js'

export async function create(input: CreateAssociateInput) {
  const cnpjExists = await prisma.associado.findUnique({ where: { cnpj: input.cnpj } })
  if (cnpjExists) throw Errors.duplicateCnpj()

  const emailExists = await prisma.associado.findUnique({ where: { email: input.email } })
  if (emailExists) throw Errors.duplicateEmail()

  const gerente = await prisma.usuario.findUnique({ where: { id: input.gerenteId } })
  if (!gerente || gerente.role !== 'gerente' || !gerente.ativo) throw Errors.gerenteInativo()

  const plano = await prisma.plano.findUnique({ where: { id: input.planoId } })
  if (!plano || !plano.ativo) throw Errors.planoInativo()

  return prisma.$transaction(async (tx) => {
    const associado = await tx.associado.create({
      data: {
        nome: input.nome,
        cnpj: input.cnpj,
        email: input.email,
        telefone: input.telefone,
        agenciaId: input.agenciaId,
        gerenteId: input.gerenteId,
        planoId: input.planoId,
        tipoAtendimento: input.tipoAtendimento,
        logradouro: input.endereco.logradouro,
        cidade: input.endereco.cidade,
        estado: input.endereco.estado,
        cep: input.endereco.cep,
      },
    })

    const numero = await gerarNumeroConta()
    const conta = await tx.conta.create({
      data: {
        numero,
        entityType: 'associado',
        associadoId: associado.id,
      },
    })

    const senhaHash = await bcrypt.hash(randomUUID(), env.BCRYPT_SALT_ROUNDS)
    await tx.usuario.create({
      data: {
        nome: input.nome,
        email: input.email,
        senhaHash,
        role: 'associate_admin',
        entityType: 'associado',
        associadoId: associado.id,
      },
    })

    return { ...associado, conta }
  })
}

export async function list(
  requester: { role: string; entityId: string },
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit
  const where =
    requester.role === 'agency_admin'
      ? { agenciaId: requester.entityId }
      : {}

  const [items, total] = await prisma.$transaction([
    prisma.associado.findMany({ where, skip, take: limit, orderBy: { criadoEm: 'desc' } }),
    prisma.associado.count({ where }),
  ])

  return { items, total }
}

export async function getById(id: string) {
  const associado = await prisma.associado.findUnique({ where: { id } })
  if (!associado) throw Errors.notFound('Associado')
  return associado
}

export async function update(id: string, input: UpdateAssociateInput) {
  await getById(id)
  const { endereco, ...rest } = input as UpdateAssociateInput & { endereco?: Record<string, string> }
  return prisma.associado.update({
    where: { id },
    data: {
      ...rest,
      ...(endereco
        ? {
            logradouro: endereco.logradouro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            cep: endereco.cep,
          }
        : {}),
    },
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
