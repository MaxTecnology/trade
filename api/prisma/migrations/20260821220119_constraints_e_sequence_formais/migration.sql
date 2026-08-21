-- Move pra migration formal o que antes só existia via $executeRaw
-- idempotente em prisma/seed.ts (débito técnico registrado em
-- docs/tech-debt.md) — um ambiente que rode só `prisma migrate deploy`
-- sem o seed subia sem a sequence de número de conta (toda criação de
-- Agência/Associado/Matriz falharia) e sem essas CHECK constraints.
-- Guardas IF NOT EXISTS mantêm idempotência pra ambientes que já
-- rodaram o seed antes.

CREATE SEQUENCE IF NOT EXISTS conta_numero_seq START 1 MINVALUE 1 MAXVALUE 9999999;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valor_rt_positivo'
  ) THEN
    ALTER TABLE oferta ADD CONSTRAINT valor_rt_positivo CHECK ("valorRT" > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quantidade_nao_negativa'
  ) THEN
    ALTER TABLE oferta ADD CONSTRAINT quantidade_nao_negativa CHECK ("quantidadeDisponivel" >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valor_transacao_positivo'
  ) THEN
    ALTER TABLE transacao ADD CONSTRAINT valor_transacao_positivo CHECK ("valorRT" > 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parcelas_validas'
  ) THEN
    ALTER TABLE transacao ADD CONSTRAINT parcelas_validas CHECK (parcelas >= 1 AND parcelas <= 12);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'nivel_maximo'
  ) THEN
    ALTER TABLE categoria ADD CONSTRAINT nivel_maximo CHECK (nivel <= 3);
  END IF;
END $$;
