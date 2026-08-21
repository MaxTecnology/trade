import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error('SEED_ADMIN_PASSWORD não definida — obrigatória em produção.')
  }
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456'
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12)
  const senhaHash = await bcrypt.hash(adminPassword, saltRounds)

  // Superadmin da Matriz
  await prisma.usuario.upsert({
    where: { email: 'admin@redetrade.com.br' },
    update: {},
    create: {
      nome: 'Administrador Matriz',
      email: 'admin@redetrade.com.br',
      senhaHash,
      role: 'superadmin',
      entityType: 'matriz',
      ativo: true,
    },
  })

  // Conta real da Matriz — não tem associadoId/agenciaId (não é 1:1 com nenhuma
  // entidade). limiteCredito alto o bastante pra nunca bloquear na prática (não é
  // uma exceção na constraint do banco, é só um valor que nunca é atingido).
  const contaMatrizExistente = await prisma.conta.findFirst({ where: { entityType: 'matriz' } })
  if (!contaMatrizExistente) {
    await prisma.conta.create({
      data: {
        numero: '0000000',
        entityType: 'matriz',
        limiteCredito: 999999999999,
      },
    })
  }

  // Categorias raiz — upsert não funciona com null em campos unique no Prisma 7
  async function upsertCategoriaRaiz(nome: string) {
    const existing = await prisma.categoria.findFirst({ where: { nome, categoriaParenteId: null } })
    if (existing) return existing
    return prisma.categoria.create({ data: { nome, nivel: 1 } })
  }

  async function upsertSubcategoria(nome: string, categoriaParenteId: string) {
    const existing = await prisma.categoria.findFirst({ where: { nome, categoriaParenteId } })
    if (existing) return existing
    return prisma.categoria.create({ data: { nome, categoriaParenteId, nivel: 2 } })
  }

  const alimentacao = await upsertCategoriaRaiz('Alimentação')
  const servicos = await upsertCategoriaRaiz('Serviços')
  const produtos = await upsertCategoriaRaiz('Produtos')

  const subcategorias = [
    { nome: 'Restaurantes', parenteId: alimentacao.id },
    { nome: 'Padarias', parenteId: alimentacao.id },
    { nome: 'Saúde', parenteId: servicos.id },
    { nome: 'Educação', parenteId: servicos.id },
    { nome: 'Beleza', parenteId: servicos.id },
    { nome: 'Eletrônicos', parenteId: produtos.id },
    { nome: 'Vestuário', parenteId: produtos.id },
  ]

  for (const sub of subcategorias) {
    await upsertSubcategoria(sub.nome, sub.parenteId)
  }

  // Sequence de número de conta e CHECK constraints (valor_rt_positivo,
  // quantidade_nao_negativa, valor_transacao_positivo, parcelas_validas,
  // nivel_maximo) viviam aqui como $executeRaw idempotente — movidas pra
  // migration formal (20260821220119_constraints_e_sequence_formais),
  // ver docs/tech-debt.md.

  console.log('Seed concluído com sucesso.')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
