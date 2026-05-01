import { prisma } from '../../config/prisma.js'
import { Errors } from '../../shared/errors/AppError.js'
import type { CreatePlanInput, UpdatePlanInput } from './plan.schema.js'

export async function create(input: CreatePlanInput) {
  return prisma.plano.create({ data: input })
}

export async function list() {
  return prisma.plano.findMany({ orderBy: { criadoEm: 'desc' } })
}

export async function getById(id: string) {
  const plano = await prisma.plano.findUnique({ where: { id } })
  if (!plano) throw Errors.notFound('Plano')
  return plano
}

export async function update(id: string, input: UpdatePlanInput) {
  await getById(id)
  return prisma.plano.update({ where: { id }, data: input })
}

export async function setStatus(id: string, ativo: boolean) {
  await getById(id)
  return prisma.plano.update({ where: { id }, data: { ativo } })
}
