import bcrypt from 'bcrypt'
import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { env } from '../../config/env.js'
import type { CreateUserInput, UpdateUserInput } from './user.schema.js'

export async function create(input: CreateUserInput) {
  const emailExists = await prisma.usuario.findUnique({ where: { email: input.email } })
  if (emailExists) throw Errors.duplicateEmail()

  if (input.entityType === 'associado' && input.role === 'associate_operator') {
    const count = await prisma.usuario.count({
      where: { associadoId: input.entityId, role: 'associate_operator' },
    })
    if (count >= 4) throw Errors.maxUsersReached()
  }

  const senhaHash = await bcrypt.hash(input.senha, env.BCRYPT_SALT_ROUNDS)

  let codigoOperador: string | undefined
  if (input.role === 'associate_operator') {
    const conta = await prisma.conta.findUnique({ where: { associadoId: input.entityId } })
    if (!conta) throw Errors.notFound('Conta do associado')

    const lastOperator = await prisma.usuario.findFirst({
      where: { associadoId: input.entityId, codigoOperador: { not: null } },
      orderBy: { codigoOperador: 'desc' },
    })

    const nextNum = lastOperator?.codigoOperador
      ? Number(lastOperator.codigoOperador.split('-')[1]) + 1
      : 1
    codigoOperador = `${conta.numero}-${String(nextNum).padStart(2, '0')}`
  }

  return prisma.usuario.create({
    data: {
      nome: input.nome,
      email: input.email,
      senhaHash,
      role: input.role,
      entityType: input.entityType,
      associadoId: input.entityType === 'associado' ? input.entityId : undefined,
      agenciaId: input.entityType === 'agencia' ? input.entityId : undefined,
      codigoOperador,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      entityType: true,
      ativo: true,
      codigoOperador: true,
      criadoEm: true,
    },
  })
}

export async function list(requester: { entityId: string; entityType: string }) {
  const where =
    requester.entityType === 'associado'
      ? { associadoId: requester.entityId }
      : { agenciaId: requester.entityId }
  return prisma.usuario.findMany({
    where,
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  })
}

export async function getById(id: string) {
  const u = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      entityType: true,
      ativo: true,
      codigoOperador: true,
      criadoEm: true,
    },
  })
  if (!u) throw Errors.notFound('Usuário')
  return u
}

export async function update(id: string, input: UpdateUserInput) {
  await getById(id)
  return prisma.usuario.update({
    where: { id },
    data: input,
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  })
}

export async function changePassword(id: string, senhaAtual: string, novaSenha: string) {
  const u = await prisma.usuario.findUnique({ where: { id } })
  if (!u) throw Errors.notFound('Usuário')
  const valid = await bcrypt.compare(senhaAtual, u.senhaHash)
  if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Senha atual incorreta.', 401)
  const senhaHash = await bcrypt.hash(novaSenha, env.BCRYPT_SALT_ROUNDS)
  await prisma.usuario.update({ where: { id }, data: { senhaHash } })
}

export async function setStatus(id: string, ativo: boolean) {
  await getById(id)
  return prisma.usuario.update({ where: { id }, data: { ativo } })
}

export async function remove(id: string) {
  await getById(id)
  await prisma.usuario.delete({ where: { id } })
}
