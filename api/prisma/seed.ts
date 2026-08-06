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

  // Planos padrão (tipo associado)
  const planos = [
    {
      nome: 'Plano Básico',
      tipoPlano: 'associado' as const,
      limiteRT: 5000,
      percentualComissao: 5.0,
    },
    {
      nome: 'Plano Intermediário',
      tipoPlano: 'associado' as const,
      limiteRT: 15000,
      percentualComissao: 4.0,
    },
    {
      nome: 'Plano Avançado',
      tipoPlano: 'associado' as const,
      limiteRT: 50000,
      percentualComissao: 3.0,
    },
  ]

  for (const plano of planos) {
    await prisma.plano.upsert({
      where: { nome_tipoPlano: { nome: plano.nome, tipoPlano: plano.tipoPlano } },
      update: {},
      create: plano,
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

  // Sequence para número de conta (7 dígitos)
  await prisma.$executeRaw`
    CREATE SEQUENCE IF NOT EXISTS conta_numero_seq START 1 MINVALUE 1 MAXVALUE 9999999;
  `

  // Constraints SQL do SCHEMA.md §4 — idempotentes via DO $$ ... $$
  await prisma.$executeRaw`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'saldo_nao_negativo'
      ) THEN
        ALTER TABLE conta ADD CONSTRAINT saldo_nao_negativo CHECK (saldo >= 0);
      END IF;
    END $$;
  `
  await prisma.$executeRaw`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valor_rt_positivo'
      ) THEN
        ALTER TABLE oferta ADD CONSTRAINT valor_rt_positivo CHECK ("valorRT" > 0);
      END IF;
    END $$;
  `
  await prisma.$executeRaw`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quantidade_nao_negativa'
      ) THEN
        ALTER TABLE oferta ADD CONSTRAINT quantidade_nao_negativa CHECK ("quantidadeDisponivel" >= 0);
      END IF;
    END $$;
  `
  await prisma.$executeRaw`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valor_transacao_positivo'
      ) THEN
        ALTER TABLE transacao ADD CONSTRAINT valor_transacao_positivo CHECK ("valorRT" > 0);
      END IF;
    END $$;
  `
  await prisma.$executeRaw`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'parcelas_validas'
      ) THEN
        ALTER TABLE transacao ADD CONSTRAINT parcelas_validas CHECK (parcelas >= 1 AND parcelas <= 12);
      END IF;
    END $$;
  `
  await prisma.$executeRaw`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'nivel_maximo'
      ) THEN
        ALTER TABLE categoria ADD CONSTRAINT nivel_maximo CHECK (nivel <= 3);
      END IF;
    END $$;
  `

  console.log('Seed concluído com sucesso.')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
