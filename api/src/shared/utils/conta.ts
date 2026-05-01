import { prisma } from '../../config/prisma.js'

export async function gerarNumeroConta(): Promise<string> {
  const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('conta_numero_seq')
  `
  const num = Number(result[0].nextval)
  return String(num).padStart(7, '0')
}
