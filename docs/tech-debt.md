# Débito técnico — Rede Trade

## [RESOLVIDO 2026-08-20] Solicitar estorno não pedia o motivo

Pedido pelo usuário: reconferir a lógica de Estorno. Duas checagens: (1) aprovação sempre pela Matriz mesmo com Agência intermediando — já estava correto (`PATCH /estornos/:id/aprovar` e `/negar` são `superadmin`-only; Agência só encaminha via `/encaminhar`, nunca aprova). (2) motivo obrigatório na solicitação, pra Matriz ter o que analisar — **não estava**: `motivo` era opcional no schema (`z.string().optional()`) e o front nunca coletava nada, sempre mandava `{transacaoId}` sem motivo (botão "Solicitar Estorno" era um popup de confirmar/cancelar simples).

**O que mudou:** `SolicitarEstornoSchema.motivo` virou obrigatório (`min(10)`, mesmo padrão de `offer.schema.ts`). Novo modal `SolicitarEstornoModal.jsx` (textarea obrigatória) substitui o popup de confirmação simples no botão "Solicitar Estorno" (usado em Meu Extrato/Transações/Cancelar Voucher, mesmo componente `Buttons.jsx` tipo `Undo`). Coluna `motivo` no banco continua nullable (linhas antigas já tinham `motivo` nulo — não fazia sentido migração NOT NULL só por causa da validação de entrada, que já é suficiente na borda).

**Validado**: via curl direto (motivo ausente/curto → 422 com a mensagem certa; motivo válido → segue pro 404 esperado de transação inexistente), via Docker + Playwright real (modal abre, bloqueia submit vazio, sucesso grava o motivo real no banco), e reconfirmado que `agency_admin` recebe 403 em `/aprovar`/`/negar`.

## [RESOLVIDO 2026-08-20] `PATCH /estornos/:id/encaminhar` e `PATCH /creditos/:id/encaminhar` sem checagem de posse (IDOR)

Pedido pelo usuário: revisão da lógica de Estorno pra ver se estava de acordo com o desenhado. Fluxo de dinheiro (`transaction.service.ts::estorno` — reversão atômica, ledger imutável, checagem de saldo, restauração de quantidade da oferta, geração de voucher) confere com o spec e está correto. Achado no processo: **`encaminhar` não checava se a solicitação era da própria agência do `agency_admin` que chamava** — qualquer `agency_admin` conseguia encaminhar (avançar de `em_analise` pra `encaminhado`) uma solicitação de estorno **ou de crédito** de qualquer outra agência, bastando adivinhar/enumerar o `id`, e a resposta ainda vazava dados da transação/associado de outro tenant. Mesma classe de bug já corrigida em `user.service.ts` nesta sessão (`POST /usuarios` e afins) — aqui não tinha sido aplicada.

**O que mudou:** `estorno.service.ts::encaminhar` e `credito.service.ts::encaminharCredito` agora recebem o `requester` (`role`, `entityId`, e `contaId` no caso de estorno, pra cobrir Agência participando direto da transação) e checam posse antes de avançar o status — `agency_admin` só encaminha o que é da própria agência (via `comprador.agenciaId`/`vendedor.agenciaId`/`contaOrigemId`/`contaDestinoId` no estorno; via `associado.agenciaId` no crédito); fora disso, `404` (não `403`, pra não confirmar a existência do id pra quem não tem acesso). `superadmin` continua encaminhando qualquer uma. `aprovar`/`negar` já eram `superadmin`-only nos dois fluxos, sem gap de tenant.

**Validado:** `tsc --noEmit` limpo, suite de testes (18/18) sem regressão. Validação end-to-end com Docker real (cross-tenant `agency_admin` tentando encaminhar solicitação de outra agência) ficou pendente — porta 3000 estava ocupada por outro processo (`autohubs/nfs-e`, projeto não relacionado, não foi encerrado) no momento do fix; revisão de código + tipos + testes deram cobertura suficiente pra confiança na correção, mas recomenda-se validar live assim que a porta estiver livre.

## [RESOLVIDO 2026-08-17] "Meus Dados" (`UsuariosDados.jsx`) sempre em branco e editável sem necessidade

Reportado via screenshot em produção: usuário Matriz abria "Meus Dados" e quase todos os campos vinham vazios (Razão Social, CNPJ, Contato, Endereço etc.), e a seção final ("Nome"/"Cpf"/"E-mail") era editável de verdade, com botão "Atualizar" fazendo `PUT`, quando a página deveria ser só visualização.

**Causa raiz (dados em branco):** a página lia tudo de `state.user`, populado só pelo snapshot enxuto de `GET /auth/me` (`{id,nome,email,role,entityType,entityId,entityName,conta}`) — nunca teve razão social, CNPJ, endereço etc. Além disso o formulário foi originalmente montado no shape do model `Associado` (`descricao`, `restricao`, `mostrarNoSite`, `tipoOperacao`, `categoriaId` — tudo exclusivo de Associado), então mesmo corrigindo a fonte de dados, Agência nunca teria esses campos (não existem no model `Agencia`), e **Matriz não é uma entidade no banco** — é só `entityType: 'matriz'` numa `Conta`, sem linha própria, então campos institucionais nunca terão dado ali.

**O que mudou:**
- Página virou 100% somente-leitura: removido o `<form>`/`onSubmit`/`updateUser`, o upload de imagem e o botão "Atualizar". Todo input é `readOnly`/sem `name`.
- Novos endpoints self-scoped (`request.user.entityId`, mesmo padrão do `/extrato`): `GET /associados/me` (roles `associate_admin`/`associate_operator`/`gerente`) e `GET /agencias/me` (`agency_admin`/`agency_operator`) — reaproveitam os `getById` já existentes.
- Matriz: sem entidade própria, mostra só o que existe de fato (Nome Fantasia + Limite de Crédito, via `/auth/me`).
- Agência: mostra os campos reais do model `Agencia`; os que não existem no model (`descricao`, `restricao`, `mostrarNoSite`, `tipoOperacao`, `aceitaOrcamento`/`aceitaVoucher`, `categoriaId`) ficam sempre em branco por decisão explícita — não são inventados nem escondidos, só não têm onde buscar dado (decisão do usuário: manter os campos no form, mesmo sempre vazios pra Agência).
- Associado tinha o mesmo bug de dados em branco (mesma causa raiz do `/auth/me` enxuto) — corrigido do mesmo jeito, agora busca via `/associados/me`.
- `GET /auth/me` ganhou `cpf` no `select` (usado na seção "Dados do usuário").
- Dois bugs de guard pré-existentes achados no processo (mesmo padrão dos já registrados nesta sessão — rota liberada só pra admin, nunca pra quem só visualiza): `GET /planos` (`plan.routes.ts`) não incluía `associate_admin`/`associate_operator`/`gerente`/`agency_operator`, então o "Plano de Inscrição" nunca resolvia pra Associado; corrigido com um guard `readRoles` dedicado (mantendo `POST`/`PUT`/`PATCH` restritos a `superadmin`).

**Achado, não corrigido (fora de escopo — afeta outras telas):** `PlanosOptions.jsx` renderiza `<option value={JSON.stringify(plano)}>`, não `value={plano.id}` — qualquer `<select>` que tente pré-selecionar um plano via `defaultValue={planoId}` (como o próprio `PlanosFields.jsx`, usado em `CadastrarAgencia`, `EditarAgenciaModal`, `EditarAssociadoModal`, `GerentesCadastrar`) nunca bate o `value` do `<option>` e sempre cai em "Selecione", mesmo com o plano certo já cadastrado. Nesta página o problema foi contornado lendo o plano direto de `entidade.plano` (já vem incluído no `GET /associados/me`/`GET /agencias/me`) em vez de reusar `PlanosFields`; os outros 4 call sites continuam com o bug.

Validado com Postgres real via Docker + Playwright, 3 papéis (Matriz/Agência/Associado): campos com dado real no banco aparecem corretos (incluindo Plano de Inscrição e Percentual de Comissão, antes sempre vazios); campos sem correspondência no model ficam em branco como esperado; nenhum papel mostra mais o botão "Atualizar".

## [RESOLVIDO 2026-08-17] `ExtratosSearch.jsx` — filtros de Associado/Agência/Comprador/Vendedor não filtravam nada em Extratos
~~Filtros de texto/seleção escreviam em `filters.table`, mas nenhuma coluna casava com essas chaves; campo Associado nem tinha `onChange` nem opções.~~ Corrigido: `constantsTransacoes.js` ganhou `id`/`filterFn` explícitos pra Comprador/Vendedor (substring case-insensitive) e duas colunas ocultas — `agencia`/`associado` — cujo `accessorFn` produz a lista de ids relevantes da linha (agência que gerencia comprador/vendedor, ou a própria agência quando ela é parte direta via `contaOrigem`/`contaDestino`; id de comprador/vendedor). Filtro client-side, sobre a página já carregada (mesmo padrão do filtro de Período).

No caminho, mais 2 bugs pré-existentes descobertos e corrigidos: `useQueryAgencias.js` não desembrulhava o envelope da API (`res.data` era `{success, data}`, não o array — afetava também o seletor de Agência no cadastro de Associado, fora do escopo desta tela); `GET /associados/diretorio` só aceitava roles de Associado — abriu pra Agência/Matriz também (`report.service.ts::relatorioPermutas` ganhou `include` de `agenciaId` do comprador/vendedor/contaOrigem/contaDestino pra sustentar o filtro de Agência).

Validado com Postgres real: Comprador/Vendedor (texto), Agência e Associado (seleção) todos filtram corretamente sobre um cenário com agência+associado gerido reais.

## Constraints de domínio aplicadas via seed.ts, não via migration formal
`saldo_nao_negativo`, `valor_rt_positivo` e demais `CHECK` constraints são aplicadas via `$executeRaw` idempotente dentro de `api/prisma/seed.ts`, não pela migration do Prisma. Um ambiente que rode só `prisma migrate deploy` sem executar o seed (ex.: pipeline futuro que separe seed de migration) sobe sem essas constraints de integridade — risco real dado que são regras invioláveis do domínio (ver `CLAUDE.md`).
**Ação futura:** mover para uma migration Prisma formal (`prisma migrate dev --create-only` + editar SQL).

## Imagem de produção da API carrega `devDependencies` inteiras
`api/Dockerfile` tem um estágio `base` (`npm ci --only=production`) que nunca é usado — o estágio `production` copia `node_modules` do `builder`, que instalou tudo (`npm ci` completo). Isso acontece porque `prisma` e `tsx` (usados em runtime pelo `entrypoint.sh` para `migrate deploy`/seed) estão em `devDependencies`.
**Ação futura:** mover `prisma` e `tsx` para `dependencies` e ajustar o Dockerfile para copiar `node_modules` do estágio `base` — reduz tamanho de imagem e superfície de CVE. Precisa validar que o Prisma Client gerado no `builder` continua acessível (ver onde `prisma generate` grava o client) antes de trocar a origem do `node_modules`.

## Seed roda em todo boot do container (idempotente, mas não ideal)
`entrypoint.sh` executa `prisma/seed.ts` a cada start/restart do container `api`, não só na primeira vez. Confirmado idempotente (upserts com `update: {}`), mas adiciona latência em todo restart e mistura responsabilidade de bootstrap com runtime.
**Ação futura:** separar seed do boot automático — rodar uma vez via `docker compose run --rm api npm run db:seed` ou flag `RUN_SEED` controlada manualmente no primeiro deploy.

## [RESOLVIDO 2026-08-14] `limiteVendaMensal`/`limiteVendaTotal` limitavam o comprador, não o vendedor
~~Os campos se chamam "limite de **venda**", mas `validarLimiteVenda` agregava débitos da conta do **comprador**~~ — herdado do antigo `plano.limiteRT`, que também limitava o comprador. Decisão de produto tomada: **o campo agora limita de fato quem vende** (agrega créditos — RT recebido — na conta de quem está vendendo), não quem compra. Quem compra já é limitado por `saldo` + `limiteCredito` (checagem própria, com CHECK constraint no banco); um teto de volume adicional do lado do comprador era redundante com isso. Do lado do vendedor não existia nenhum freio — vender é só crédito na conta — e é isso que o negócio quer limitar (evitar que um membro flood a economia de RT vendendo desproporcionalmente).

**O que mudou:** `validarLimiteVenda` (`limites.ts`) agrega `tipo: 'credito'` em vez de `tipo: 'debito'`. `permuta()`/`negociada()` (`transaction.service.ts`) passam a chamar essa validação com a conta do **vendedor** (resolvendo `limiteVendaMensal`/`Total` do vendedor por `entityType`, mesma regra de null pra Agência já estabelecida), não mais do comprador. `relatorioUsoPlanoConta` (`report.service.ts`) também passou a agregar crédito, pra ficar consistente. Validado com Postgres real: comprador com `limiteVendaMensal` baixíssimo consegue comprar normalmente (só saldo/crédito importam); venda que estouraria o limite mensal do vendedor é bloqueada; acumulado entre `permuta` e `negociada` do mesmo vendedor soma corretamente no mesmo mês.

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

## [RESOLVIDO 2026-08-14] `estorno.service.ts`/`report.service.ts` filtravam só por `compradorId`/`vendedorId`, ignorando compra/venda de Agência e Matriz
~~Ambos os módulos filtravam transações só por `compradorId`/`vendedorId` — FK só de `Associado`, ficam `null` quando quem compra/vende é Agência ou Matriz.~~ Corrigido: `relatorioPermutas`/`relatorioComissoes` (`report.service.ts`) e `solicitarEstorno`/`listarFilhas` (`estorno.service.ts`) passam a considerar também `contaOrigemId`/`contaDestinoId` — a agência (ou Matriz) participando diretamente de uma transação (via Oferta) agora aparece nos relatórios e no fluxo de estorno da própria agência, além dos associados que ela já gerenciava. Validado com Postgres real: Agência comprando de Associado agora aparece em `/relatorios/permutas`, `/relatorios/comissoes` (comissão calculada corretamente) e `/estornos/filhos`.

## [RESOLVIDO 2026-08-14] Agência sem `planoId` vinculado compra com comissão 0%, silenciosamente
~~Quando a Agência compradora não tinha `planoId` preenchido, `permuta()`/`negociada()` calculavam `comissaoBRL = 0` sem erro nem log.~~ Decisão de produto tomada: `planoId` vira **obrigatório** na criação de Agência, igual já era pra Associado — não dá mais pra esse estado existir a partir de agora.

**O que mudou:** `Agencia.planoId` (schema Prisma + migration `20260814230000_agencia_planoid_obrigatorio`) passa de opcional pra obrigatório; `createAgencySchema` exige `planoId`; `PlanosFields` no formulário de cadastro de Agência (`CadastrarAgencia.jsx`) deixou de ser `optional` (o front já tinha o campo, só não era exigido). Atualização de Agência existente (`updateAgencySchema`) continua com `planoId` opcional — não força reescolher o plano a cada edição.

**Risco de migração:** a migration `SET NOT NULL` falha de propósito se existir Agência com `planoId` nulo — sem backfill automático, sem plano arbitrário atribuído por conta própria. Ambiente resetado nesta sessão pra validar (`docker compose down -v` + `up`), então não houve dado a preservar. Se algum dia isso rodar contra um banco com Agências reais sem plano, é preciso atribuir manualmente antes.

## Lógica de resolução do comprador duplicada entre `permuta()` e `negociada()`
O branch por `entityType` da conta compradora (resolver Associado/Agência/Matriz, comissão, limites — ~27 linhas) está duplicado entre `permuta()` e `negociada()` em `transaction.service.ts`. Aceito nesta rodada (ruling do controlador do processo durante as revisões das Tasks 1-8) porque as duas funções têm nuances próprias (uma envolve oferta e decremento de estoque, a outra não) e a duplicação ainda é pequena o bastante pra não compensar o risco de uma abstração prematura.
**Ação futura:** se essa lógica crescer, ou um terceiro ponto de entrada financeiro similar aparecer, extrair um helper compartilhado (ex: `resolverCompradorParaCompra(contaId)`).

## Checagem de saldo em `permuta()`/`negociada()` acontece fora da transação Prisma
Mesmo padrão pré-existente (não é regressão desta rodada) — a validação de `saldoSuficienteParaDebito` roda antes do `prisma.$transaction`, então duas operações concorrentes da mesma conta podem ambas passar a validação de aplicação; só a `CHECK` constraint do banco barra a segunda, retornando um erro genérico de constraint em vez de `INSUFFICIENT_BALANCE`. Achado e registrado durante a revisão das Tasks 1-8.
**Ação futura:** mapear esse erro de constraint do banco pra uma resposta HTTP amigável (`INSUFFICIENT_BALANCE`, 422), ou mover a checagem pra dentro da transação com lock explícito.

## [RESOLVIDO 2026-08-14] `GET /auth/me` retornava `conta: null` pra Matriz
Desde a Task 1 (2026-08-13) o JWT da Matriz já carregava um `contaId` real, mas `/auth/me` (`auth.service.ts`) não tinha sido atualizado pra resolver e retornar essa conta — só existiam branches pra `associado`/`agencia`. Corrigido: `me()` ganhou o terceiro branch (`entityType === 'matriz'`), buscando a `Conta` por `entityType` (mesmo padrão do `login()`) e retornando `{ id, numero, saldo, limiteCredito }` real. Validado com Postgres real — Matriz e Associado confirmados sem regressão.

## Runbook de deploy da migration `20260814190919_oferta_conta_generica`
Migration da Task 3 (compra/venda por Agência e Matriz) que torna `oferta.contaId` genérico (dono pode ser Associado, Agência ou Matriz) e faz `oferta.associadoId` virar opcional. **Antes de aplicar em produção**, rodar essa checagem de sanidade do backfill:
```sql
SELECT count(*) FROM oferta o LEFT JOIN conta c ON c."associadoId" = o."associadoId" WHERE c.id IS NULL;
```
Tem que dar **0** — se não der, o `UPDATE` de backfill (que popula `oferta.contaId` a partir de `conta.associadoId`) vai deixar linhas com `contaId` nulo, e o `ALTER COLUMN "contaId" SET NOT NULL` subsequente falha, travando o deploy.

Além disso, a migration segura locks em `oferta` **e** em `conta` (a tabela financeira mais usada do sistema) até o commit — o Prisma envolve o arquivo inteiro numa transação, então `ALTER COLUMN ... SET NOT NULL`, `ADD CONSTRAINT ... FOREIGN KEY` e `CREATE INDEX` (sem `CONCURRENTLY`) seguram esses locks o tempo todo, bloqueando escritas concorrentes em `conta` durante a aplicação. Se `oferta` crescer muito antes do deploy real acontecer, vale considerar rodar em janela de baixo tráfego.

## [RESOLVIDO 2026-08-14] `POST /usuarios` aceitava `entityType`/`entityId` do corpo sem checar posse

Achado na revisão final da branch de compra/venda por Agência e Matriz (2026-08-14) — vulnerabilidade pré-existente, não introduzida por essa branch, mas amplificada por ela (JWT forjado passava a permitir gastar saldo/RT da agência-vítima via `/transacoes/permuta`/`/negociada`). Corrigido em sessão separada: o módulo inteiro de usuários (`user.schema.ts`/`user.service.ts`/`user.controller.ts`) foi revisado — não só `create()`, mas também `getById`/`update`/`changePassword`/`setStatus`/`remove`, que também não filtravam por posse.

**O que mudou:** `createUserSchema` não aceita mais `entityId`/`entityType` do body — sempre derivados de `request.user`, com checagem de compatibilidade `role`×`entityType` (agência só cria `agency_*`, associado só cria `associate_*`). Todas as funções que operam por `id` (`getById`/`update`/`setStatus`/`remove`) passam a exigir `mesmoTenant(requester, target)` (mesma Agência/Associado, ou `superadmin`) — `404` em vez de `403` quando não bate, pra não confirmar a existência do id pra quem não tem acesso. `changePassword` ficou estritamente self-only (`id === requester.id`), já que exige `senhaAtual`.

**Validado** com dois tenants reais (Agência Vítima + Agência Atacante) via Postgres/Redis Docker: exploit original bloqueado (usuário criado fica no tenant do atacante, não no da vítima informado no body); `GET`/`PUT`/`PATCH status`/`DELETE` cross-tenant retornam 404; troca de senha de outro usuário (mesmo tenant) retorna 403; `role` incompatível retorna 403; `superadmin` mantém acesso irrestrito (bypass intencional); fluxos legítimos (mesmo tenant, self-service de senha) continuam 200.

## [RESOLVIDO 2026-08-14] `transaction.service.ts` `getById()` não filtrava por posse

~~Achado na revisão final da branch de compra/venda por Agência e Matriz (2026-08-14) — qualquer `associate_operator`+ autenticado conseguia ler qualquer transação por id.~~ Corrigido junto com o item acima na mesma sessão de hardening — ver commit que adiciona filtro `OR: [{ contaOrigemId: contaId }, { contaDestinoId: contaId }]` em `getById`, mesmo padrão que `list()` já aplicava.

## [Alto — PARCIALMENTE RESOLVIDO 2026-08-14] Matriz emitindo RT via `permuta()`/`negociada()` sem rastreio contábil equivalente ao de `credito()`

Achado na revisão final da branch de compra/venda por Agência e Matriz — interação entre a Task 1 (Matriz ganhou `Conta` real com `limiteCredito` altíssimo fixo, "sem limite na prática") e a Task 7 (guard de `/transacoes/permuta`/`/negociada` abriu pra `superadmin`). Um `superadmin` "comprando" como Matriz cria RT novo levando o saldo da Matriz a negativo — exatamente como o fluxo já existente `credito()`, mas gravado como `tipo: 'permuta'`/`'negociada'`.

**Parte resolvida:** `limiteCredito` da Matriz deixou de ser um valor mágico só no seed — agora é editável via `PATCH /matriz/limite-credito` (`superadmin`-only, módulo novo `api/src/modules/matriz/`), dando visibilidade/auditabilidade operacional sobre o teto, mesmo que o valor continue alto na prática.

**Parte ainda pendente (decisão de produto):** essas transações continuam gravadas como `tipo: 'permuta'`/`'negociada'`, fora do relatório de emissão que hoje só olha `tipo: 'credito'`. Como o `report.service.ts` agora já enxerga a Matriz normalmente em `relatorioPermutas`/`relatorioComissoes` (ver item de filtros acima, resolvido junto), a visibilidade básica já existe — falta decidir se vale a pena um relatório dedicado de "emissão via compra" separado do relatório de permutas comum, ou se basta a visão já disponível.

## [RESOLVIDO 2026-08-14] Visibilidade pós-compra de Agência/Matriz

Consolidação de achados já registrados separadamente. Era: Agência gastava RT normalmente, mas não conseguia ver a própria transação em relatório, no fluxo de estorno, nem via `GET /transacoes*`/`avaliar` (guard dessas duas últimas era Associado-only).

**O que mudou:** relatórios (`relatorioPermutas`/`relatorioComissoes`), estorno (`solicitarEstorno`/`listarFilhas`) e agora também `GET /transacoes`, `GET /transacoes/:id` e `PATCH /transacoes/:id/avaliar` (guard `transaction.routes.ts` trocado de `operator`, Associado-only, pra `comprador`, que já incluía `agency_admin`/`agency_operator`/`superadmin`) mostram/permitem a participação direta da Agência/Matriz. Decisão de baixo risco: `list()`/`getById()` já filtravam por `contaOrigemId`/`contaDestinoId` (fix de segurança desta sessão), e `avaliar()` já checava `usuarioIniciadorId` por usuário, não por role — abrir o guard não exigiu nenhuma mudança de lógica de autorização, só ampliar quem pode chegar até ela.

Validado com Postgres real: Agência vê a própria transação em `GET /transacoes`/`GET /transacoes/:id`, avalia a compra que ela mesma fez; outra Agência (não participante) recebe 404 em `getById` e 403 em `avaliar`; Associado sem regressão.
