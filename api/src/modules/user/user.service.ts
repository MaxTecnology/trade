import bcrypt from 'bcrypt'
import type { RoleUsuario, EntityType } from '@prisma/client'
import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import { env } from '../../config/env.js'
import { proximoCodigoOperador } from '../../shared/utils/conta.js'
import type { CreateUserInput, UpdateUserInput } from './user.schema.js'

export type Requester = {
  id: string
  role: RoleUsuario
  entityType: EntityType
  entityId: string
}

// Um usuário só pode ver/gerenciar usuários do próprio tenant (mesma
// Agência ou mesmo Associado) — exceto superadmin, que enxerga todos.
function mesmoTenant(requester: Requester, target: { associadoId: string | null; agenciaId: string | null }) {
  if (requester.role === 'superadmin') return true
  if (requester.entityType === 'associado') return target.associadoId === requester.entityId
  if (requester.entityType === 'agencia') return target.agenciaId === requester.entityId
  return false
}

export async function create(input: CreateUserInput, requester: Requester) {
  if (requester.entityType !== 'associado' && requester.entityType !== 'agencia') {
    throw Errors.forbidden()
  }
  const roleCompativel =
    requester.entityType === 'associado'
      ? input.role === 'associate_admin' || input.role === 'associate_operator'
      : input.role === 'agency_admin' || input.role === 'agency_operator'
  if (!roleCompativel) throw Errors.forbidden()

  const entityType = requester.entityType
  const entityId = requester.entityId

  const emailExists = await prisma.usuario.findUnique({ where: { email: input.email } })
  if (emailExists) throw Errors.duplicateEmail()

  if (entityType === 'associado' && input.role === 'associate_operator') {
    const count = await prisma.usuario.count({
      where: { associadoId: entityId, role: 'associate_operator' },
    })
    if (count >= 4) throw Errors.maxUsersReached()
  }

  const senhaHash = await bcrypt.hash(input.senha, env.BCRYPT_SALT_ROUNDS)

  // Todo usuário novo (admin ou operador, Associado ou Agência) ganha um
  // código sequencial dentro da mesma conta compartilhada — só identificação
  // (usuarioIniciadorId), não é conta nem saldo separado.
  const contaWhere = entityType === 'associado' ? { associadoId: entityId } : { agenciaId: entityId }
  const conta = await prisma.conta.findUnique({ where: contaWhere })
  if (!conta) throw Errors.notFound('Conta da entidade')

  const lastUser = await prisma.usuario.findFirst({
    where: { ...contaWhere, codigoOperador: { not: null } },
    orderBy: { codigoOperador: 'desc' },
  })
  const codigoOperador = proximoCodigoOperador(conta.numero, lastUser?.codigoOperador)

  return prisma.usuario.create({
    data: {
      nome: input.nome,
      email: input.email,
      senhaHash,
      role: input.role,
      entityType,
      associadoId: entityType === 'associado' ? entityId : undefined,
      agenciaId: entityType === 'agencia' ? entityId : undefined,
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
    select: { id: true, nome: true, email: true, role: true, ativo: true, codigoOperador: true, criadoEm: true },
  })
}

export async function getById(id: string, requester: Requester) {
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
      associadoId: true,
      agenciaId: true,
    },
  })
  // 404 em vez de 403 quando o id existe mas é de outro tenant — não
  // confirma pra quem não tem acesso que aquele id existe.
  if (!u || !mesmoTenant(requester, u)) throw Errors.notFound('Usuário')
  const { associadoId: _associadoId, agenciaId: _agenciaId, ...safe } = u
  return safe
}

export async function update(id: string, input: UpdateUserInput, requester: Requester) {
  await getById(id, requester)
  return prisma.usuario.update({
    where: { id },
    data: input,
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  })
}

export async function changePassword(
  id: string,
  senhaAtual: string,
  novaSenha: string,
  requester: Requester,
) {
  // Troca de senha é sempre self-service (exige a senha atual) — nunca em
  // nome de outro usuário, nem por admin do mesmo tenant.
  if (id !== requester.id) throw Errors.forbidden()
  const u = await prisma.usuario.findUnique({ where: { id } })
  if (!u) throw Errors.notFound('Usuário')
  const valid = await bcrypt.compare(senhaAtual, u.senhaHash)
  if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Senha atual incorreta.', 401)
  const senhaHash = await bcrypt.hash(novaSenha, env.BCRYPT_SALT_ROUNDS)
  await prisma.usuario.update({ where: { id }, data: { senhaHash } })
}

// Reset de senha pelo admin (associate_admin/agency_admin) — cobre "a
// pessoa esqueceu a senha". Diferente de changePassword: não exige a senha
// atual, mas só funciona no mesmo tenant (getById já checa isso).
export async function resetPassword(id: string, novaSenha: string, requester: Requester) {
  await getById(id, requester)
  const senhaHash = await bcrypt.hash(novaSenha, env.BCRYPT_SALT_ROUNDS)
  await prisma.usuario.update({ where: { id }, data: { senhaHash } })
}

export async function setStatus(id: string, ativo: boolean, requester: Requester) {
  await getById(id, requester)
  return prisma.usuario.update({
    where: { id },
    data: { ativo },
    select: { id: true, nome: true, email: true, role: true, ativo: true, codigoOperador: true },
  })
}

export async function remove(id: string, requester: Requester) {
  await getById(id, requester)
  await prisma.usuario.delete({ where: { id } })
}
