-- =====================================================================
-- LIMPEZA DO AMBIENTE ONLINE (staging) — deixa só a Matriz (superadmin)
-- =====================================================================
-- ANTES DE RODAR:
--   1. Faça backup: pg_dump -U <user> -d <db> -F c -f backup_antes_limpeza.dump
--   2. Confira as contagens do SELECT abaixo pra ter noção do volume
--   3. Rode o bloco inteiro dentro de uma transação (já está com BEGIN/COMMIT)
--      — se algo parecer errado no meio, dá pra ROLLBACK antes do COMMIT.
--
-- O QUE FICA: usuário superadmin da Matriz, conta da Matriz (saldo
-- resetado pra 0 — comente a linha do UPDATE conta se quiser manter o
-- saldo atual), Planos, Categorias (configuração, não dado de teste).
--
-- O QUE É APAGADO: todos os Associados, Agências, Gerentes/operadores,
-- Transações, Ofertas, Vouchers, Cobranças, Solicitações de Crédito e de
-- Estorno, Movimentações de conta (exceto as da própria Matriz, se
-- decidir manter o saldo dela).
-- =====================================================================

-- Contagens ANTES (rode isso primeiro pra conferir o volume real)
select 'associado' as tabela, count(*) from associado
union all select 'agencia', count(*) from agencia
union all select 'usuario (não-superadmin)', count(*) from usuario where role != 'superadmin'
union all select 'transacao', count(*) from transacao
union all select 'oferta', count(*) from oferta
union all select 'voucher', count(*) from voucher
union all select 'cobranca', count(*) from cobranca
union all select 'solicitacao_credito', count(*) from solicitacao_credito
union all select 'solicitacao_estorno', count(*) from solicitacao_estorno;

BEGIN;

-- Quebra a referência circular associado.gerenteId -> usuario antes de
-- poder apagar os usuários gerente.
UPDATE associado SET "gerenteId" = NULL;

-- Tabelas "folha" (dependem de transacao/associado/agencia/usuario,
-- nada depende delas)
DELETE FROM voucher;
DELETE FROM comissao_gerente;
DELETE FROM solicitacao_estorno;
DELETE FROM movimentacao_conta WHERE "contaId" NOT IN (SELECT id FROM conta WHERE "entityType" = 'matriz');
DELETE FROM transacao;
DELETE FROM oferta;
DELETE FROM cobranca;
DELETE FROM solicitacao_credito;
DELETE FROM contato_associado;
DELETE FROM contato_agencia;

-- Contas (exceto a da Matriz)
DELETE FROM conta WHERE "entityType" != 'matriz';

-- Usuários (exceto o(s) superadmin da Matriz) — e os refresh tokens deles
DELETE FROM refresh_token WHERE "usuarioId" NOT IN (SELECT id FROM usuario WHERE role = 'superadmin');
DELETE FROM usuario WHERE role != 'superadmin';

-- Associados e Agências
DELETE FROM associado;
DELETE FROM agencia;

-- Opcional: zera o saldo da Matriz também, pra começar 100% do zero.
-- Comente essa linha se quiser manter o saldo atual dela.
UPDATE conta SET saldo = 0 WHERE "entityType" = 'matriz';

COMMIT;

-- Contagens DEPOIS (confirme que só sobrou o esperado)
select 'associado' as tabela, count(*) from associado
union all select 'agencia', count(*) from agencia
union all select 'usuario', count(*) from usuario
union all select 'conta', count(*) from conta;
