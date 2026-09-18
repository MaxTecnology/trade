/*
  Warnings:

  - You are about to drop the column `comissaoRT` on the `comissao_gerente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "comissao_gerente" DROP COLUMN "comissaoRT";

-- CreateTable
CREATE TABLE "pagamento_gerente" (
    "id" TEXT NOT NULL,
    "gerenteId" TEXT NOT NULL,
    "competencia" DATE NOT NULL,
    "valorBRL" DECIMAL(15,2) NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "pagoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamento_gerente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagamento_gerente_gerenteId_idx" ON "pagamento_gerente"("gerenteId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_gerente_gerenteId_competencia_key" ON "pagamento_gerente"("gerenteId", "competencia");

-- AddForeignKey
ALTER TABLE "pagamento_gerente" ADD CONSTRAINT "pagamento_gerente_gerenteId_fkey" FOREIGN KEY ("gerenteId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
