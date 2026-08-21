// One-off: atribui codigoOperador retroativo pra usuários criados antes de
// esse campo virar obrigatório pra todo mundo (antes só associate_operator
// ganhava). Roda uma vez, idempotente (pula quem já tem código).
//
// Uso: npx tsx scripts/backfill-codigo-operador.ts
import { prisma } from '../src/config/prisma.js'
import { proximoCodigoOperador } from '../src/shared/utils/conta.js'

async function main() {
  const usuarios = await prisma.usuario.findMany({
    where: {
      codigoOperador: null,
      OR: [{ associadoId: { not: null } }, { agenciaId: { not: null } }],
    },
    orderBy: [{ associadoId: 'asc' }, { agenciaId: 'asc' }, { criadoEm: 'asc' }],
  })

  console.log(`${usuarios.length} usuário(s) sem código.`)

  for (const u of usuarios) {
    const contaWhere = u.associadoId ? { associadoId: u.associadoId } : { agenciaId: u.agenciaId! }
    const conta = await prisma.conta.findUnique({ where: contaWhere })
    if (!conta) {
      console.log(`Sem conta pra usuário ${u.id} (${u.email}) — pulando.`)
      continue
    }
    const last = await prisma.usuario.findFirst({
      where: { ...contaWhere, codigoOperador: { not: null } },
      orderBy: { codigoOperador: 'desc' },
    })
    const codigo = proximoCodigoOperador(conta.numero, last?.codigoOperador)
    await prisma.usuario.update({ where: { id: u.id }, data: { codigoOperador: codigo } })
    console.log(`${u.email} -> ${codigo}`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
