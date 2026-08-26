-- DropForeignKey
ALTER TABLE "solicitacao_credito" DROP CONSTRAINT "solicitacao_credito_associadoId_fkey";

-- AlterTable
ALTER TABLE "solicitacao_credito" ADD COLUMN     "agenciaId" TEXT,
ALTER COLUMN "associadoId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "solicitacao_credito_agenciaId_criadoEm_idx" ON "solicitacao_credito"("agenciaId", "criadoEm");

-- AddForeignKey
ALTER TABLE "solicitacao_credito" ADD CONSTRAINT "solicitacao_credito_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_credito" ADD CONSTRAINT "solicitacao_credito_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CheckConstraint: exatamente um dos dois donos deve estar preenchido
ALTER TABLE "solicitacao_credito" ADD CONSTRAINT "solicitacao_credito_dono_unico" CHECK (
  ("associadoId" IS NOT NULL AND "agenciaId" IS NULL) OR
  ("associadoId" IS NULL AND "agenciaId" IS NOT NULL)
);
