import { prisma } from '../../config/prisma.js'

export async function gerarNumeroConta(): Promise<string> {
  const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('conta_numero_seq')
  `
  const num = Number(result[0].nextval)
  return String(num).padStart(7, '0')
}

// Código amigável de identificação por usuário dentro da mesma Conta
// compartilhada (Associado/Agência) — "{numeroConta}-{sequencial}". O admin
// principal (criado junto com a entidade) é sempre -01; passar
// ultimoCodigo=null/undefined nesse caso. Não é uma conta separada nem
// muda saldo/limite — só identifica quem fez o quê (usuarioIniciadorId).
export function proximoCodigoOperador(numeroConta: string, ultimoCodigo?: string | null): string {
  const proximoNumero = ultimoCodigo ? Number(ultimoCodigo.split('-')[1]) + 1 : 1
  return `${numeroConta}-${String(proximoNumero).padStart(2, '0')}`
}
