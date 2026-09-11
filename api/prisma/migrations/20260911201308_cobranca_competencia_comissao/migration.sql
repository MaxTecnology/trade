-- AlterTable
ALTER TABLE "cobranca" ADD COLUMN     "competencia" DATE;

-- Índice único parcial: no máximo uma Cobranca de comissão por conta/mês de
-- referência. O job mensal de consolidação (commission.consolidate) confia
-- nisso pra ser idempotente — se rodar duas vezes pro mesmo mês (reprocesso
-- manual, retry de job travado), a segunda tentativa de create falha com
-- violação de unicidade em vez de duplicar a cobrança.
CREATE UNIQUE INDEX IF NOT EXISTS "cobranca_comissao_competencia_unica"
  ON "cobranca" ("contaId", "competencia")
  WHERE "tipo" = 'comissao';
