-- AlterTable
ALTER TABLE "associado" ADD COLUMN     "reputacaoMedia" DECIMAL(2,1),
ADD COLUMN     "totalAvaliacoes" INTEGER NOT NULL DEFAULT 0;

-- Backfill: notaAtendimento já era coletado (avaliar()) muito antes de
-- existir qualquer agregação — sem isso, associados com histórico de
-- avaliações ficariam "sem avaliações" até a próxima venda, perdendo dado
-- real que já está no banco.
UPDATE "associado" a
SET "reputacaoMedia" = agregado.media,
    "totalAvaliacoes" = agregado.total
FROM (
  SELECT "vendedorId" AS associado_id, ROUND(AVG("notaAtendimento"), 1) AS media, COUNT(*) AS total
  FROM "transacao"
  WHERE "vendedorId" IS NOT NULL AND "notaAtendimento" IS NOT NULL
  GROUP BY "vendedorId"
) agregado
WHERE a.id = agregado.associado_id;
