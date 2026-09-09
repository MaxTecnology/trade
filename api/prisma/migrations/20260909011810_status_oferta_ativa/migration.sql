-- Renomeia o valor 'aberta' do enum StatusOferta pra 'ativa' — mais claro
-- semanticamente ("ativa" pareia melhor com "pausada"/"fechada" do que
-- "aberta"). RENAME VALUE é in-place: linhas existentes com status 'aberta'
-- passam a reportar 'ativa' automaticamente, sem precisar de UPDATE
-- separado. Não confundir com o enum StatusLoja (Associado.statusLoja),
-- que também tem um valor 'aberta' mas é um conceito totalmente diferente
-- (loja aberta pra negócio) e não é tocado por esta migration.
ALTER TYPE "StatusOferta" RENAME VALUE 'aberta' TO 'ativa';
