# Débito técnico — Rede Trade

## Constraints de domínio aplicadas via seed.ts, não via migration formal
`saldo_nao_negativo`, `valor_rt_positivo` e demais `CHECK` constraints são aplicadas via `$executeRaw` idempotente dentro de `api/prisma/seed.ts`, não pela migration do Prisma. Um ambiente que rode só `prisma migrate deploy` sem executar o seed (ex.: pipeline futuro que separe seed de migration) sobe sem essas constraints de integridade — risco real dado que são regras invioláveis do domínio (ver `CLAUDE.md`).
**Ação futura:** mover para uma migration Prisma formal (`prisma migrate dev --create-only` + editar SQL).

## Imagem de produção da API carrega `devDependencies` inteiras
`api/Dockerfile` tem um estágio `base` (`npm ci --only=production`) que nunca é usado — o estágio `production` copia `node_modules` do `builder`, que instalou tudo (`npm ci` completo). Isso acontece porque `prisma` e `tsx` (usados em runtime pelo `entrypoint.sh` para `migrate deploy`/seed) estão em `devDependencies`.
**Ação futura:** mover `prisma` e `tsx` para `dependencies` e ajustar o Dockerfile para copiar `node_modules` do estágio `base` — reduz tamanho de imagem e superfície de CVE. Precisa validar que o Prisma Client gerado no `builder` continua acessível (ver onde `prisma generate` grava o client) antes de trocar a origem do `node_modules`.

## Seed roda em todo boot do container (idempotente, mas não ideal)
`entrypoint.sh` executa `prisma/seed.ts` a cada start/restart do container `api`, não só na primeira vez. Confirmado idempotente (upserts com `update: {}`), mas adiciona latência em todo restart e mistura responsabilidade de bootstrap com runtime.
**Ação futura:** separar seed do boot automático — rodar uma vez via `docker compose run --rm api npm run db:seed` ou flag `RUN_SEED` controlada manualmente no primeiro deploy.

## `limiteVendaMensal`/`limiteVendaTotal` limitam o comprador, não o vendedor (nome sugere o contrário)
Achado na revisão final da branch `feature/limite-credito-e-limite-venda`: os campos se chamam "limite de **venda**", mas `validarLimiteVenda` (`api/src/shared/utils/limites.ts`) agrega débitos da conta do **comprador**, ou seja, limitam quanto o associado pode *comprar*, não vender. Isso preserva o comportamento que já existia antes (o antigo `plano.limiteRT` também limitava o comprador) — não é regressão desta branch, mas o nome do campo (herdado do front, ver `Form_Operacoes.jsx`) sugere o oposto. Hoje não existe nenhum teto pro volume de *vendas* de um associado.
**Ação futura:** decisão de produto — renomear os campos pra refletir o que fazem (ex: `limiteCompraMensal`/`limiteCompraTotal`), ou adicionar um teto de vendas separado se isso for realmente necessário pro negócio.

## Cobertura de teste parcial em `limites.ts`
Só `saldoSuficienteParaDebito` (função pura) tem teste automatizado. `getLimiteCreditoDaConta` e `validarLimiteVenda` (as duas funções que tocam banco) não têm cobertura — `validarLimiteVenda` também é difícil de testar como está porque importa `prisma` diretamente (sem injeção de dependência).
**Ação futura:** se/quando esse módulo crescer, considerar aceitar um `client: PrismaClient | Prisma.TransactionClient` como parâmetro pra permitir teste com client mockado.

## Corte de "mês corrente" em `validarLimiteVenda` usa timezone do servidor
`limites.ts` calcula início do mês com `setDate(1)/setHours(0,0,0,0)`, que resolve no timezone do container (UTC em produção), não no timezone de negócio (UTC-3). Transações nas primeiras 3h do mês (horário de Brasília) contam pro mês anterior. Comportamento pré-existente (idêntico ao `plano.limiteRT` que essa branch substituiu), não é regressão nova.
**Ação futura:** usar timezone explícito de negócio no cálculo, não o do servidor.

## `TASK.md` desatualizado após a migração de limiteRT do plano pra limiteVendaMensal/Total
`api/docs/TASK.md` ainda lista como concluído "Validar limite RT do plano antes de criar oferta" e "Validar limite mensal do plano" — ambos descrevem comportamento retirado por essa branch (ver `SPEC.md` §9, já atualizado). `TASK.md` é checklist histórico de construção, baixo risco, mas vale sincronizar numa próxima passada de limpeza de docs.

## `negociada()` só generaliza o lado comprador — Agência/Matriz não conseguem vender por negociação direta
`negociadaSchema.vendedorId` continua exigindo um `Associado.id` — a compra/venda por Agência e Matriz (Task 9, ver `AJUSTES.md` 2026-08-13) generalizou o **comprador** de `permuta()`/`negociada()` e o dono de `Oferta`, mas não o **vendedor** de `negociada()`. Agência/Matriz só conseguem vender via `Oferta` (marketplace), não por negociação direta sem oferta.
**Ação futura:** se o negócio precisar, `negociadaSchema.vendedorId` precisa aceitar um `contaId` genérico, com ajuste correspondente no front (hoje o "diretório de associados" só lista Associados).

## Sem tela de front pra Agência/Matriz cadastrar oferta ou comprar
A API de Ofertas/Transações está pronta e validada end-to-end (curl + Postgres real, ver `task-9-report.md`) para Agência e Matriz como compradoras/donas de oferta — mas não existe nenhuma tela no front que use isso. Front é rodada separada, fora do escopo desta branch.

## `estorno.service.ts`/`report.service.ts` filtram por `compradorId`/`vendedorId`, ignorando compra/venda de Agência e Matriz
Ambos os módulos filtram transações por `compradorId`/`vendedorId` — campos que são FK só de `Associado` e ficam `null` quando quem compra/vende é Agência ou Matriz (ver Task 9). Resultado: compras/vendas de Agência ou Matriz somem dos relatórios (`report.service.ts`) e do fluxo de solicitação de estorno por `agency_operator` (`estorno.service.ts`). Achado e registrado durante a revisão das Tasks 1-8 (ruling do controlador do processo: fora do escopo desta rodada, não é regressão nova — esses filtros já existiam antes e nunca cobriram compra/venda por conta genérica).
**Ação futura:** migrar esses filtros pra `contaOrigemId`/`contaDestinoId`, que já cobrem 100% dos casos (Associado, Agência e Matriz).

## Agência sem `planoId` vinculado compra com comissão 0%, silenciosamente
Quando a Agência compradora não tem `planoId` preenchido, `permuta()`/`negociada()` calculam `comissaoBRL = 0` sem erro nem log. Achado durante a revisão das Tasks 1-8; ruling do controlador do processo: não é uma decisão técnica, é uma decisão de produto pendente (bloquear a compra? logar um aviso? deixar como está?) — precisa de definição do dono do produto antes de mudar o comportamento.

## Lógica de resolução do comprador duplicada entre `permuta()` e `negociada()`
O branch por `entityType` da conta compradora (resolver Associado/Agência/Matriz, comissão, limites — ~27 linhas) está duplicado entre `permuta()` e `negociada()` em `transaction.service.ts`. Aceito nesta rodada (ruling do controlador do processo durante as revisões das Tasks 1-8) porque as duas funções têm nuances próprias (uma envolve oferta e decremento de estoque, a outra não) e a duplicação ainda é pequena o bastante pra não compensar o risco de uma abstração prematura.
**Ação futura:** se essa lógica crescer, ou um terceiro ponto de entrada financeiro similar aparecer, extrair um helper compartilhado (ex: `resolverCompradorParaCompra(contaId)`).

## Checagem de saldo em `permuta()`/`negociada()` acontece fora da transação Prisma
Mesmo padrão pré-existente (não é regressão desta rodada) — a validação de `saldoSuficienteParaDebito` roda antes do `prisma.$transaction`, então duas operações concorrentes da mesma conta podem ambas passar a validação de aplicação; só a `CHECK` constraint do banco barra a segunda, retornando um erro genérico de constraint em vez de `INSUFFICIENT_BALANCE`. Achado e registrado durante a revisão das Tasks 1-8.
**Ação futura:** mapear esse erro de constraint do banco pra uma resposta HTTP amigável (`INSUFFICIENT_BALANCE`, 422), ou mover a checagem pra dentro da transação com lock explícito.

## `GET /auth/me` continua retornando `conta: null` pra Matriz
Desde a Task 1 (2026-08-13) o JWT da Matriz já carrega um `contaId` real, mas `/auth/me` (`auth.service.ts`) não foi atualizado para resolver e retornar essa conta — continua tratando Matriz como `conta: null` (mesmo padrão do superadmin sem conta, mas agora incorreto pra Matriz especificamente). Inconsistência entre o que o login/JWT já sabe e o que `/me` expõe, que pode confundir consumidores futuros do endpoint. Achado durante a revisão das Tasks 1-8; `/me` ficou fora do escopo desta rodada.

## Runbook de deploy da migration `20260814190919_oferta_conta_generica`
Migration da Task 3 (compra/venda por Agência e Matriz) que torna `oferta.contaId` genérico (dono pode ser Associado, Agência ou Matriz) e faz `oferta.associadoId` virar opcional. **Antes de aplicar em produção**, rodar essa checagem de sanidade do backfill:
```sql
SELECT count(*) FROM oferta o LEFT JOIN conta c ON c."associadoId" = o."associadoId" WHERE c.id IS NULL;
```
Tem que dar **0** — se não der, o `UPDATE` de backfill (que popula `oferta.contaId` a partir de `conta.associadoId`) vai deixar linhas com `contaId` nulo, e o `ALTER COLUMN "contaId" SET NOT NULL` subsequente falha, travando o deploy.

Além disso, a migration segura locks em `oferta` **e** em `conta` (a tabela financeira mais usada do sistema) até o commit — o Prisma envolve o arquivo inteiro numa transação, então `ALTER COLUMN ... SET NOT NULL`, `ADD CONSTRAINT ... FOREIGN KEY` e `CREATE INDEX` (sem `CONCURRENTLY`) seguram esses locks o tempo todo, bloqueando escritas concorrentes em `conta` durante a aplicação. Se `oferta` crescer muito antes do deploy real acontecer, vale considerar rodar em janela de baixo tráfego.
