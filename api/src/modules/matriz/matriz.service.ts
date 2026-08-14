import { prisma } from '../../config/prisma.js'
import { Errors } from '../../shared/errors/AppError.js'
import type { UpdateLimiteCreditoInput } from './matriz.schema.js'

export async function updateLimiteCredito(input: UpdateLimiteCreditoInput) {
  const conta = await prisma.conta.findFirst({ where: { entityType: 'matriz' } })
  if (!conta) throw Errors.notFound('Conta da Matriz')

  return prisma.conta.update({
    where: { id: conta.id },
    data: { limiteCredito: input.limiteCredito },
    select: { id: true, numero: true, saldo: true, limiteCredito: true },
  })
}
