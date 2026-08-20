-- DropForeignKey
ALTER TABLE "agencia" DROP CONSTRAINT "agencia_planoId_fkey";

-- DropForeignKey
ALTER TABLE "oferta" DROP CONSTRAINT "oferta_associadoId_fkey";

-- AlterTable
ALTER TABLE "solicitacao_credito" ADD COLUMN     "respostaMatriz" TEXT;

-- AlterTable
ALTER TABLE "solicitacao_estorno" ADD COLUMN     "respostaMatriz" TEXT;

-- AddForeignKey
ALTER TABLE "agencia" ADD CONSTRAINT "agencia_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta" ADD CONSTRAINT "oferta_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE SET NULL ON UPDATE CASCADE;
