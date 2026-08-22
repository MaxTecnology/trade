-- Índice único parcial: no máximo uma SolicitacaoEstorno "ativa" (em_analise
-- ou encaminhado) por transação. A checagem em solicitarEstorno() (findFirst
-- antes do create) tem uma corrida clássica — duas requisições concorrentes
-- podem ambas passar a checagem antes de qualquer uma criar a linha. Esse
-- índice garante a regra no banco, independente de qualquer corrida na
-- aplicação; a segunda tentativa concorrente falha com violação de unicidade,
-- mapeada em app.ts pro mesmo erro amigável que a checagem de aplicação já usa.
CREATE UNIQUE INDEX IF NOT EXISTS "solicitacao_estorno_transacao_ativa_unica"
  ON "solicitacao_estorno" ("transacaoId")
  WHERE "status" IN ('em_analise', 'encaminhado');
