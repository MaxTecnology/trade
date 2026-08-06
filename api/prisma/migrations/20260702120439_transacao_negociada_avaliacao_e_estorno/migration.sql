-- CreateEnum
CREATE TYPE "StatusEstorno" AS ENUM ('em_analise', 'encaminhado', 'aprovado', 'negado');

-- AlterEnum
ALTER TYPE "TipoTransacao" ADD VALUE 'negociada';

-- AlterTable
ALTER TABLE "transacao" ADD COLUMN     "comentarioAvaliacao" TEXT,
ADD COLUMN     "notaAtendimento" INTEGER;

-- CreateTable
CREATE TABLE "solicitacao_estorno" (
    "id" TEXT NOT NULL,
    "transacaoId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "motivo" TEXT,
    "status" "StatusEstorno" NOT NULL DEFAULT 'em_analise',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacao_estorno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitacao_estorno_transacaoId_idx" ON "solicitacao_estorno"("transacaoId");

-- CreateIndex
CREATE INDEX "solicitacao_estorno_status_idx" ON "solicitacao_estorno"("status");

-- AddForeignKey
ALTER TABLE "solicitacao_estorno" ADD CONSTRAINT "solicitacao_estorno_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_estorno" ADD CONSTRAINT "solicitacao_estorno_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
