# Plano de Organização — Rede Trade

> Última atualização: 2026-07-01
> Ler este arquivo no início de cada sessão para saber o estado atual.

---

## Contexto

Sistema funciona em dev local, mas nunca foi validado rodando 100% via Docker, e o schema do banco estava sem migration formal (`prisma db push`). Objetivo desta rodada: deixar o sistema pronto para uso real, sem esses riscos, e organizar o repositório como monorepo (docker-compose na raiz).

---

## Etapas

### 1. Limpeza de código morto — ✅ concluído
- [x] Removido `front/src/FirebaseConfig.js` (órfão, sem imports — substituído pelo B2)
- [x] Removida dependência `firebase` do `front/package.json`

### 2. Docker Compose completo — ✅ concluído
- [x] Descomentados os serviços `api` e `frontend`
- [x] `docker compose build api frontend` — build limpo, sem erros
- [x] `docker compose up -d` — stack completa sobe (postgres, redis, api, frontend)

### 3. Secrets no `.env` — ✅ concluído
- [x] B2 já estava preenchido (o grep inicial só escondeu por engano — corrigido no diagnóstico)
- [x] `JWT_SECRET` e `JWT_REFRESH_SECRET` — eram placeholders fracos (`"...change_in_production"`), trocados por valores aleatórios de 48 bytes
- [x] `SEED_ADMIN_PASSWORD` — era `Admin@123456` (fraca), trocada por senha aleatória forte

### 4. Migration formal do Prisma — ✅ concluído
- [x] Banco de dev resetado (autorizado pelo usuário — dados eram apenas de teste)
- [x] `npx prisma migrate dev --name init` — migration `20260702020114_init` criada e commitada
- [x] `entrypoint.sh`: `prisma db push` → `prisma migrate deploy`

### 5. Seed e validação end-to-end — ✅ concluído
- [x] Seed rodou sem erros (local e dentro do container)
- [x] Login do superadmin validado via `/auth/login` — token emitido corretamente
- [x] `/auth/me` validado — retorna `entityName: "Matriz"`, `conta: null` (superadmin não tem conta)
- [x] Frontend (nginx, porta 80) e proxy `/api/` → API validados com `curl`

### 6. Atualizar documentação desatualizada — ✅ concluído
`api/docs/SCHEMA.md` e `api/docs/SPEC.md` estavam descrevendo o `Plano` e `ComissaoGerente` antigos (pré-`AJUSTES.md`):
- [x] `SCHEMA.md` — bloco Prisma completo resincronizado com `api/prisma/schema.prisma` real
- [x] `SPEC.md` §3 (Associados), §5 (Gerentes), §6 (Planos) — refletindo os campos atuais

### 7. Monorepo — docker-compose na raiz — ✅ concluído
- [x] `docker-compose.yml` movido de `api/` para a raiz do repositório
- [x] `build.context` ajustado para `./api` e `./front`
- [x] `env_file` do serviço `api` aponta para `./api/.env`
- [x] Testado build + up a partir da raiz — stack `trade-*` validada (login, `/auth/me`, proxy frontend)
- [x] Volumes/containers órfãos do stack antigo (`api_*`) removidos
- [x] Referências a `api/docker-compose.yml` e nomes de container `api-*` atualizadas em `CLAUDE.md` e `AJUSTES.md`

### 8. Testes E2E (Playwright) — front → backend — ✅ concluído
Suíte já existente em `front/tests/*.spec.js` rodada e corrigida até **19/19 passando**. Detalhes completos em `AJUSTES.md` §Testes E2E. Resumo:
- [x] **Bug real corrigido**: cadastro de associado com taxa de inscrição em RT quebrava com 500 (`saldo_nao_negativo`) — a conta era debitada diretamente na criação, violando a invariante de saldo nunca negativo. Corrigido para gerar `Cobranca` (RT), mesmo padrão já usado para BRL.
- [x] Migration `20260702024347_cobranca_rt_e_valorbrl_opcional` — `Cobranca.valorBRL` opcional, `Cobranca.valorRT` adicionado
- [x] **Bug de config corrigido**: `.env` tinha `B2_APP_KEY` em vez de `B2_APPLICATION_KEY` (nome que o código espera) — upload de imagem quebrava com 500. `B2_REGION`/`B2_PUBLIC_URL` também haviam sumido, recolocados.
- [x] Specs reordenados (`01-` a `09-`) + execução sequencial (`workers: 1`) — testes compartilham estado no banco
- [x] Corrigida guarda falho-negativa no teste de seleção de gerente
- [x] Fixture de imagem de upload recriada

### 9. Testes manuais dos endpoints `.http` — ✅ concluído
Todos os módulos percorridos contra a API real. Detalhes completos em `AJUSTES.md` §Testes manuais dos endpoints `.http`. **4 bugs reais corrigidos**:
- [x] 🔴 Criar agência sem credenciais separadas corrompia a conta do superadmin (`entityType`/`entityId` sobrescritos)
- [x] 🟠 `senhaHash` vazando na resposta de `PATCH /usuarios/:id/status`
- [x] 🟠 Erro de validação Zod retornando 500 em vez de 400 (dual-package hazard no `instanceof`)
- [x] 🟡 `associate_admin` não conseguia fazer permuta (guard só liberava `associate_operator`)
- [x] 🟡 Estorno de permuta quebrava com 500 se o recebedor já tivesse gasto o RT (faltava validação de saldo)
- [x] `.http` desatualizados corrigidos: `planos.http`, `associados.http`, `gerentes.http`

---

## Débito técnico observado (não bloqueante)

- Constraints SQL (`saldo >= 0`, `valorRT > 0`, etc.) são aplicadas via `$executeRaw` idempotente dentro do `seed.ts`, não pela migration. Funciona, mas o ideal seria estarem na própria migration do Prisma.
- Confirmar com o time se a `B2_PUBLIC_URL` restaurada (`https://f005.backblazeb2.com/file/redetrade`) ainda é válida com as novas chaves B2 — testado com upload real e funcionou, mas vale confirmação formal.
- Recurso "Gerente" não foi validado nos testes E2E do Playwright (nenhum gerente existe no seed) — porém **foi validado manualmente via `.http`** nesta rodada, incluindo comissão de inscrição.
- **Geração de PDF do voucher não implementada** (`voucher.service.ts::getPdf` é stub) — `GET /vouchers/:id/pdf` devolve JSON, não PDF. Requer decisão sobre biblioteca (PDFKit sugerido no próprio comentário do código) — feature nova, não bug.

---

### 10. Auditoria de integridade de dados — ✅ concluído
Motivada pelo bug do estorno restaurando sempre `+1`: auditados todos os schemas Zod contra os models Prisma, procurando campos recebidos/existentes no banco mas descartados silenciosamente. Detalhes completos em `AJUSTES.md` §Auditoria de integridade de dados. **2 bugs reais corrigidos**:
- [x] 🔴 `Transacao` não guardava `quantidade` da permuta — estorno restaurava sempre `+1` na oferta, não importa quantas unidades foram compradas. Adicionado `Transacao.quantidade Int?` (migration `20260702040322_transacao_quantidade_e_oferta_campos`). **Validado**: compra de 5 unidades → estorno → 5 voltaram ao estoque.
- [x] 🔴 `Oferta.imagemUrl`/`vencimento` existiam no banco mas o Zod schema de criação/atualização não os aceitava — qualquer valor enviado pelo front era descartado sem erro. Adicionados ao schema e à persistência.
- [x] Auditados sem problema: Agência, Associado, Plano, Categoria, Gerente, Crédito RT, Cobrança.
- [x] Regressão completa (Playwright 19/19 + revalidação manual dos fixes anteriores) após as mudanças de schema.

### 11. Error handler global do Fastify nunca era chamado — ✅ concluído (achado mais crítico da sessão)
`app.setErrorHandler` era registrado depois de `app.register(rotas)` — cada plugin de rota herda a config de erro do pai no momento em que é registrado (encapsulamento do Fastify), então **nenhuma rota real herdava o handler customizado desde o início do projeto**. Todo erro (validação, saldo insuficiente, not-found, etc.) saía no formato bruto do Fastify em vez do envelope `{success:false, error:{...}}` documentado — e todo toast de erro no front (que lê `error.response.data.error.message`) mostrava `undefined`. Só erros 401/403 pareciam certos (guards respondem manualmente, sem passar pelo handler). Corrigido movendo o registro do handler para antes de `app.register(rotas)`. Detalhes e causa raiz completos em `AJUSTES.md` §Correções críticas.

### 12. Módulo Ofertas nunca migrado pra API nova — ✅ concluído
Ao contrário de Categorias/Planos/Gerentes (já migrados), Ofertas ainda usava a convenção antiga em cadastro, edição, tabela, cards e listagens — cadastro 100% quebrado, listagens sempre vazias (`data.ofertas` não existe no envelope), botão de excluir chamando endpoint inexistente, botão de comprar sem `onClick`. Reescrito por completo (8 arquivos no front + 1 no back). Novo teste permanente `front/tests/10-ofertas.spec.js`. Detalhes completos em `AJUSTES.md`.

### 13. Bugs relacionados encontrados de raspão — ✅ concluído
- [x] 13 lugares no front lendo `err.response.data.message` em vez de `err.response.data.error.message` (mensagens de erro sempre `undefined` nos toasts)
- [x] `valorRt` (grafia errada) em vez de `valorRT` nas tabelas de Transações e Vouchers — colunas de valor sempre vazias/"Indefinido"

### 14. Auditoria completa de Transações e Vouchers + 2 features novas — ✅ concluído
Diferente de Ofertas (drift de nomes), aqui o front implementava um **modelo de negócio inteiro que a API não suportava**. Decisões de design validadas com o usuário antes de implementar (ver `AJUSTES.md` §Módulos: Transações e Vouchers para o raciocínio completo):
- [x] **Negociação direta** entre associados (fora do marketplace de Ofertas), sempre em RT (usuário confirmou: sem dinheiro real envolvido — campo `valorAdicional` em R$ removido do front). Novo `POST /transacoes/negociada`, `Transacao.tipo` ganhou o valor `negociada`.
- [x] **Avaliação pós-transação** (nota 1-5 + comentário): `PATCH /transacoes/:id/avaliar`, novos campos `notaAtendimento`/`comentarioAvaliacao` em `Transacao`.
- [x] **Diretório de associados** (`GET /associados/diretorio`) — endpoint novo, mínimo e sem dados financeiros, pra escolher parceiro de negociação sem vazar saldo de outros negócios (a listagem admin `GET /associados` é restrita e expõe saldo/plano).
- [x] **Fluxo de estorno com solicitação/aprovação** (`SolicitacaoEstorno`, módulo `estorno` novo, mesmo padrão de Créditos RT) — três telas do front (`TransaçõesExtorno`, `CancelarVouchers`, `VoucherSolicitarCancelar`) esperavam isso e tinham comentários `// TODO: API precisa de filtro...` confirmando o gap conhecido.
- [x] Reescrito todo o front relacionado: `TransaçãoCadastrar.jsx`, `VoucherCadastrar.jsx`, `ListasHook.js` (`createT`, `refound`/`sendRefound`/`aproveRefound`/`negarRefound`), `TransaçõesMinhas.jsx`, `TransaçõesExtorno.jsx`, `CancelarVouchers.jsx`, `VoucherSolicitarCancelar.jsx`, `TransaçõesModal.jsx` (campos comprador/vendedor estavam trocados), colunas de tabelas.
- [x] Migration `20260702120439_transacao_negociada_avaliacao_e_estorno`.
- [x] Validado end-to-end pelo navegador real: negociação → avaliação persistida (confirmada via query direta no banco) → solicitação de estorno → encaminhar → aprovar (saldo revertido corretamente).
- [x] Regressão completa Playwright 21/21 após todas as mudanças.

### 15. Coerência do ciclo financeiro + auditoria de estrutura do banco — ✅ concluído
Usuário perguntou se a lógica de negócio geral era coerente. Investigação encontrou dois pontos onde valores financeiros eram calculados/registrados mas nunca efetivamente cobrados — "dinheiro no papel". Detalhes completos em `AJUSTES.md` §Coerência do ciclo financeiro:
- [x] 🔴 `PATCH /cobrancas/:id/quitar` não movia RT nenhum (só `pago: true`) — cobrança em RT introduzida nesta sessão (fix da inscrição) nunca era paga de verdade. Corrigido: quitação em RT agora debita o devedor e credita a agência vinculada, atomicamente, validando saldo.
- [x] 🔴 Comissão da plataforma (`comissaoBRL`) calculada em toda transação mas nunca virava cobrança — worker `commission.calculate` era um no-op. Corrigido: cria `Cobranca` (BRL) vinculada via `transacaoId` (campo que já existia, nunca usado), cobrada do comprador.
- [x] Auditoria de estrutura do banco: achado e corrigido `ComissaoGerente.associadoId` sem `@relation` (sem integridade referencial); adicionadas `CHECK` constraints pra `Cobranca` (valor BRL ou RT obrigatório) e `Transacao.notaAtendimento` (1-5) — direto na migration, não no `seed.ts` (resolve parte do débito técnico já registrado).
- [x] Migration `20260703012446_comissao_cobranca_e_integridade`.
- [x] Validado via curl com verificação direta no banco: quitação de cobrança RT move saldo corretamente (devedor -300, agência +300); comissão de negociação de 1000 RT a 3% gera cobrança de R$30 automaticamente.
- [x] Regressão completa Playwright 21/21.

---

## Débito técnico registrado (não bloqueante, fora do escopo desta sessão)
- `ContasModal.jsx` (módulo Cobranças) tem o mesmo bug de campos comprador/vendedor trocados que `TransaçõesModal.jsx` tinha — mesmo padrão, não corrigido.
- Módulo de Cobranças/Contas a Receber não foi auditado com a mesma profundidade que Ofertas/Transações/Vouchers — pode ter problemas estruturais semelhantes.
- Constraints antigas (`saldo_nao_negativo`, `valor_rt_positivo`, etc.) continuam no `seed.ts` via `$executeRaw`, não numa migration — não movidas nesta rodada por risco de conflito com bancos que já têm essas constraints aplicadas pelo seed.
- Sem índice único parcial impedindo duas `SolicitacaoEstorno` simultâneas para a mesma transação — checado só na aplicação, Prisma não suporta índice parcial nativo (precisaria de SQL bruto). Baixo risco, registrado como melhoria futura.
- ~~`Agencia.create()` (service) não retorna a `conta` recém-criada na resposta~~ — [RESOLVIDO 2026-08-21], ver `docs/tech-debt.md`.

---

## Referência cruzada
- `AJUSTES.md` — histórico de correções já aplicadas (front↔API)
- `api/docs/TASK.md` — checklist original de construção da API
- `docs/tech-debt.md` — débitos técnicos relevantes (a criar se necessário)
