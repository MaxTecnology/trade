import { prisma } from '../../config/prisma.js'
import { AppError, Errors } from '../../shared/errors/AppError.js'
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schema.js'

export async function create(input: CreateCategoryInput) {
  let nivel = 1
  if (input.categoriaParenteId) {
    const parente = await prisma.categoria.findUnique({
      where: { id: input.categoriaParenteId },
    })
    if (!parente) throw Errors.notFound('Categoria pai')
    if (parente.nivel >= 3) {
      throw new AppError('VALIDATION_ERROR', 'Hierarquia máxima de 3 níveis atingida.', 422)
    }
    nivel = parente.nivel + 1
  }
  return prisma.categoria.create({
    data: {
      nome: input.nome,
      ativo: input.ativo ?? true,
      categoriaParenteId: input.categoriaParenteId ?? null,
      nivel,
    },
  })
}

export async function tree() {
  const all = await prisma.categoria.findMany({
    where: { ativo: true, categoriaParenteId: null },
    include: {
      categoriasFilhas: {
        where: { ativo: true },
        include: { categoriasFilhas: { where: { ativo: true } } },
      },
    },
  })
  return all
}

export async function getById(id: string) {
  const cat = await prisma.categoria.findUnique({ where: { id } })
  if (!cat) throw Errors.notFound('Categoria')
  return cat
}

export async function update(id: string, input: UpdateCategoryInput) {
  await getById(id)
  return prisma.categoria.update({ where: { id }, data: input })
}

export async function setStatus(id: string, ativo: boolean) {
  const cat = await getById(id)
  if (!ativo) {
    const inUse = await prisma.oferta.count({ where: { categoriaId: id } })
    if (inUse > 0) throw Errors.categoriaInUse()
  }
  return prisma.categoria.update({ where: { id }, data: { ativo } })
}
