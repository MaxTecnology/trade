import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { prisma } from '../../config/prisma.js'
import { getRedis } from '../../config/redis.js'
import { env } from '../../config/env.js'
import { Errors } from '../../shared/errors/AppError.js'
import type { LoginInput } from './auth.schema.js'

const LOGIN_ATTEMPTS_KEY = (email: string) => `login_attempts:${email}`
const MAX_ATTEMPTS = 5
const LOCK_SECONDS = 15 * 60

export async function login(input: LoginInput) {
  const redis = getRedis()
  const attemptsKey = LOGIN_ATTEMPTS_KEY(input.email)

  const usuario = await prisma.usuario.findUnique({ where: { email: input.email } })

  if (!usuario || !usuario.ativo) {
    await redis.incr(attemptsKey)
    await redis.expire(attemptsKey, LOCK_SECONDS)
    throw Errors.invalidCredentials()
  }

  const lockedUntil = await redis.get(`login_locked:${input.email}`)
  if (lockedUntil) throw Errors.accountLocked()

  const attempts = Number(await redis.get(attemptsKey) ?? 0)
  if (attempts >= MAX_ATTEMPTS) {
    await redis.set(`login_locked:${input.email}`, '1', 'EX', LOCK_SECONDS)
    throw Errors.accountLocked()
  }

  const valid = await bcrypt.compare(input.senha, usuario.senhaHash)
  if (!valid) {
    await redis.incr(attemptsKey)
    await redis.expire(attemptsKey, LOCK_SECONDS)
    throw Errors.invalidCredentials()
  }

  await redis.del(attemptsKey)
  await redis.del(`login_locked:${input.email}`)

  const entityId =
    usuario.entityType === 'associado'
      ? usuario.associadoId!
      : usuario.entityType === 'agencia'
        ? usuario.agenciaId!
        : 'matriz'

  let contaId: string | undefined
  if (usuario.entityType === 'associado' && usuario.associadoId) {
    const conta = await prisma.conta.findUnique({ where: { associadoId: usuario.associadoId } })
    contaId = conta?.id
  } else if (usuario.entityType === 'agencia' && usuario.agenciaId) {
    const conta = await prisma.conta.findUnique({ where: { agenciaId: usuario.agenciaId } })
    contaId = conta?.id
  }

  const accessToken = jwt.sign(
    { role: usuario.role, entityType: usuario.entityType, entityId, contaId },
    env.JWT_SECRET,
    { subject: usuario.id, expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  )

  const refreshToken = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({
    data: { token: refreshToken, usuarioId: usuario.id, expiresAt },
  })

  return {
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      entityType: usuario.entityType,
      entityId,
    },
  }
}

export async function refresh(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
  if (!stored || stored.revogado || stored.expiresAt < new Date()) {
    throw Errors.unauthorized()
  }

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: stored.usuarioId } })
  if (!usuario.ativo) throw Errors.unauthorized()

  const entityId =
    usuario.entityType === 'associado'
      ? usuario.associadoId!
      : usuario.entityType === 'agencia'
        ? usuario.agenciaId!
        : 'matriz'

  const accessToken = jwt.sign(
    { role: usuario.role, entityType: usuario.entityType, entityId },
    env.JWT_SECRET,
    { subject: usuario.id, expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  )

  return { accessToken }
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revogado: true },
  })
}

export async function me(userId: string) {
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      entityType: true,
      associadoId: true,
      agenciaId: true,
    },
  })

  const entityId =
    usuario.entityType === 'associado'
      ? usuario.associadoId!
      : usuario.entityType === 'agencia'
        ? usuario.agenciaId!
        : 'matriz'

  let contaId: string | undefined
  if (usuario.entityType === 'associado' && usuario.associadoId) {
    const conta = await prisma.conta.findUnique({ where: { associadoId: usuario.associadoId } })
    contaId = conta?.id
  }

  return { ...usuario, entityId, contaId }
}
