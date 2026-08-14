-- Oferta passa a ter dono genérico (Associado, Agência ou Matriz) via contaId.
-- associadoId vira opcional — continua preenchido quando o dono é um Associado
-- (denormalizado, mesmo padrão já usado em Cobranca.associadoId/agenciaId).

ALTER TABLE "oferta" ADD COLUMN "contaId" TEXT;

-- Backfill: toda oferta existente pertence a um Associado — preenche contaId a
-- partir da Conta 1:1 desse Associado.
UPDATE "oferta" o
SET "contaId" = c.id
FROM "conta" c
WHERE c."associadoId" = o."associadoId";

ALTER TABLE "oferta" ALTER COLUMN "contaId" SET NOT NULL;
ALTER TABLE "oferta" ALTER COLUMN "associadoId" DROP NOT NULL;

ALTER TABLE "oferta" ADD CONSTRAINT "oferta_contaId_fkey"
  FOREIGN KEY ("contaId") REFERENCES "conta"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX "oferta_contaId_idx" ON "oferta"("contaId");
