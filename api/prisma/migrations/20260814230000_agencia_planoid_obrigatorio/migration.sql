-- Agencia.planoId passa a ser obrigatório, igual já é pra Associado — sem
-- plano vinculado, uma Agência compra/vende com comissão 0% silenciosamente
-- (achado registrado em docs/tech-debt.md).
--
-- Essa migration FALHA de propósito se existir alguma Agencia com planoId
-- nulo (SET NOT NULL não faz backfill automático) — não escolhemos um plano
-- arbitrário por ela. Antes de rodar em qualquer ambiente com dado real,
-- rode:
--   SELECT id, nome FROM agencia WHERE "planoId" IS NULL;
-- e atribua um plano manualmente pra cada uma antes de aplicar.

ALTER TABLE "agencia" ALTER COLUMN "planoId" SET NOT NULL;
