-- Taxa de Inscrição/Manutenção Anual do Plano passam a representar R$
-- (dinheiro real recebido pela Matriz), não mais RT. RENAME COLUMN
-- preserva os dados existentes — não é um drop+add.
ALTER TABLE "plano" RENAME COLUMN "taxaInscricaoRT" TO "taxaInscricao";
ALTER TABLE "plano" RENAME COLUMN "taxaManutencaoAnualRT" TO "taxaManutencaoAnual";
