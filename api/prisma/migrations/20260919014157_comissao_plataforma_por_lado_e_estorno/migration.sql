/*
  Warnings:

  - You are about to drop the column `comissaoBRL` on the `transacao` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusComissao" AS ENUM ('ativa', 'estornada');

-- AlterTable
ALTER TABLE "comissao_gerente" ADD COLUMN     "pagamentoGerenteId" TEXT,
ADD COLUMN     "status" "StatusComissao" NOT NULL DEFAULT 'ativa';

-- AlterTable
ALTER TABLE "transacao" DROP COLUMN "comissaoBRL";

-- CreateTable
CREATE TABLE "comissao_plataforma" (
    "id" TEXT NOT NULL,
    "transacaoId" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "associadoId" TEXT,
    "agenciaId" TEXT,
    "operacao" "TipoOperacao" NOT NULL,
    "baseValorRT" DECIMAL(15,2) NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "comissaoBRL" DECIMAL(15,2) NOT NULL,
    "status" "StatusComissao" NOT NULL DEFAULT 'ativa',
    "cobrancaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comissao_plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comissao_plataforma_transacaoId_idx" ON "comissao_plataforma"("transacaoId");

-- CreateIndex
CREATE INDEX "comissao_plataforma_contaId_status_idx" ON "comissao_plataforma"("contaId", "status");

-- AddForeignKey
ALTER TABLE "comissao_gerente" ADD CONSTRAINT "comissao_gerente_pagamentoGerenteId_fkey" FOREIGN KEY ("pagamentoGerenteId") REFERENCES "pagamento_gerente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao_plataforma" ADD CONSTRAINT "comissao_plataforma_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao_plataforma" ADD CONSTRAINT "comissao_plataforma_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao_plataforma" ADD CONSTRAINT "comissao_plataforma_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao_plataforma" ADD CONSTRAINT "comissao_plataforma_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao_plataforma" ADD CONSTRAINT "comissao_plataforma_cobrancaId_fkey" FOREIGN KEY ("cobrancaId") REFERENCES "cobranca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
