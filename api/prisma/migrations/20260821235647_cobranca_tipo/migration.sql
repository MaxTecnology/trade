-- CreateEnum
CREATE TYPE "TipoCobranca" AS ENUM ('inscricao', 'manutencao', 'comissao', 'outro');

-- AlterTable
ALTER TABLE "cobranca" ADD COLUMN     "tipo" "TipoCobranca" NOT NULL DEFAULT 'outro';

-- Backfill de linhas existentes: cobrança com transacaoId veio do job de comissão
-- da plataforma (bullmq.ts); cobrança sem transacaoId mas com descrição de
-- inscrição veio do cadastro de Associado (associate.service.ts). O resto
-- (ex: cobranças manuais antigas sem padrão claro) fica como 'outro'.
UPDATE "cobranca" SET "tipo" = 'comissao' WHERE "transacaoId" IS NOT NULL;
UPDATE "cobranca" SET "tipo" = 'inscricao' WHERE "transacaoId" IS NULL AND "descricao" ILIKE 'Inscrição%';
