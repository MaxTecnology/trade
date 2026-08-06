-- AddForeignKey
ALTER TABLE "comissao_gerente" ADD CONSTRAINT "comissao_gerente_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Integridade financeira: uma cobrança precisa ter valor em BRL ou RT (nunca os dois nulos)
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_valor_definido" CHECK ("valorBRL" IS NOT NULL OR "valorRT" IS NOT NULL);

-- Nota de atendimento sempre entre 1 e 5, quando preenchida
ALTER TABLE "transacao" ADD CONSTRAINT "nota_atendimento_valida" CHECK ("notaAtendimento" IS NULL OR ("notaAtendimento" >= 1 AND "notaAtendimento" <= 5));
