import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { gerarNumeroConta } from '../../shared/utils/conta.js'
import type { CreateAgencyInput, UpdateAgencyInput } from './agency.schema.js'

export async function create(input: CreateAgencyInput, creatorId: string) {
  const exists = await prisma.agencia.findUnique({ where: { cnpj: input.cnpj } })
  if (exists) throw Errors.duplicateCnpj()

  const emailExists = await prisma.agencia.findUnique({ where: { email: input.email } })
  if (emailExists) throw new AppError('DUPLICATE_EMAIL', 'E-mail de agência já cadastrado.', 409)

  if (input.tipo === 'comum' && !input.agenciaParenteId) {
    throw new AppError('VALIDATION_ERROR', 'Agência comum requer agenciaParenteId.', 400)
  }

  return prisma.$transaction(async (tx) => {
    const agencia = await tx.agencia.create({
      data: {
        nome: input.nome,
        cnpj: input.cnpj,
        tipo: input.tipo,
        email: input.email,
        telefone: input.telefone,
        agenciaParenteId: input.agenciaParenteId ?? null,
        logradouro: input.endereco.logradouro,
        cidade: input.endereco.cidade,
        estado: input.endereco.estado,
        cep: input.endereco.cep,
      },
    })

    const numero = await gerarNumeroConta()
    await tx.conta.create({
      data: {
        numero,
        entityType: 'agencia',
        agenciaId: agencia.id,
      },
    })

    await tx.usuario.update({
      where: { id: creatorId },
      data: { agenciaId: agencia.id, entityType: 'agencia' },
    })

    return agencia
  })
}

export async function list(requester: { role: string; entityId: string }) {
  if (requester.role === 'superadmin') {
    return prisma.agencia.findMany({ orderBy: { criadoEm: 'desc' } })
  }
  return prisma.agencia.findMany({
    where: { id: requester.entityId },
    orderBy: { criadoEm: 'desc' },
  })
}

export async function getById(id: string) {
  const agencia = await prisma.agencia.findUnique({ where: { id } })
  if (!agencia) throw Errors.notFound('Agência')
  return agencia
}

export async function update(id: string, input: UpdateAgencyInput) {
  await getById(id)
  const { endereco, ...rest } = input as UpdateAgencyInput & { endereco?: Record<string, string> }
  return prisma.agencia.update({
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
