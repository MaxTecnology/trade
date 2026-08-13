-- AlterTable
ALTER TABLE "conta" ADD COLUMN "limiteCredito" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- Backfill from associado
UPDATE "conta" c
SET "limiteCredito" = a."limiteCredito"
FROM "associado" a
WHERE a.id = c."associadoId" AND a."limiteCredito" IS NOT NULL;

-- Backfill from agencia
UPDATE "conta" c
SET "limiteCredito" = ag."limiteCredito"
FROM "agencia" ag
WHERE ag.id = c."agenciaId" AND ag."limiteCredito" IS NOT NULL;

-- Restore a real, per-account database-level guarantee (replaces the old
-- universal saldo_nao_negativo CHECK removed in migration 20260813015241)
ALTER TABLE "conta" ADD CONSTRAINT "saldo_acima_limite_credito" CHECK (saldo >= -"limiteCredito");
