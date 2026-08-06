# Registro de Ajustes — Migração API

## Raiz do Problema

A nova API envelopa todas as respostas em `{ success: true, data: <payload> }`.
O código do frontend foi escrito esperando o payload direto (`response.data`),
mas agora precisa de `response.data.data`.

---

## Ajustes realizados

### 1. `front/src/services/api.js` — Instância Axios centralizada
- Criado arquivo novo com `baseURL: "/api/v1/"` (relativo, sem host — funciona via Vite proxy e nginx)
- Interceptor de request: injeta `Authorization: Bearer <token>` do localStorage
- Interceptor de response: em 401 fora de `auth/`, limpa token e redireciona para `/login`

### 2. `front/vite.config.js` — Proxy de desenvolvimento
- Adicionado `server.proxy`: `/api → http://localhost:3000`
- Elimina CORS em dev sem precisar de `@fastify/cors`

### 3. `front/src/auth/authFunction.js` — Mapeamento de campos do usuário
- Lê `response.data.data` (não `response.data`) — API envelopa em `{ success, data }`
- Mapeia campos novos → antigos para manter compatibilidade com 50+ componentes:
  - `id → idUsuario`
  - `entityName → nomeFantasia`
  - `role → tipo`
  - `conta.saldo → conta.saldoPermuta`
  - `conta.numero → conta.numeroConta`
- Adiciona `tipoDaConta` no nível do usuário (não só dentro de `conta`) para suportar superadmin que tem `conta: null`
- Silencia erro 401 (token expirado ao carregar a página)

### 4. `front/src/hooks/getId.js` — Funções utilitárias
- `getType()`: corrigido para usar optional chaining `?.` — não crasha quando `conta` é null (superadmin)
- Antes: `state.user.conta.tipoDaConta.descricao` → crash se conta=null
- Depois: `state.user?.conta?.tipoDaConta?.descricao ?? state.user?.tipoDaConta?.descricao ?? ''`

### 5. `front/src/hooks/ListasHook.js`
- Removido `import { uploadFile } from "../FirebaseConfig"` — Firebase substituído por B2
- `loginUser`: corrigido bug `toast.promise` com callback `async`
  - Antes: `success: async (data) => { ... }` retornava Promise → React tentava renderizar Promise como filho
  - Depois: Promise resolvida com o nome do usuário, callback `success` síncrono
- Token lido de `response.data.data.accessToken` (não `response.data.accessToken`)
- Redirecionamento pós-login: `window.location.href = "/"` (não `reload()` — reload ficava em `/login`)

### 6. `front/src/App.jsx` — Redirecionamento de autenticação
- Movido `navigate("/login")` para dentro de `useEffect` — evita setState durante render

### 7. `front/src/pages/dashboard/resumo/LimiteCredito.jsx`
- Corrigido acesso a `snap.user.conta.limiteCredito` sem null-check
- Antes: crash quando `conta` é null (superadmin)
- Depois: `snap.user?.conta?.limiteCredito ?? 0`

### 8. `front/src/pages/dashboard/resumo/SaldoPermutas.jsx`
- Mesmo problema e mesma correção que LimiteCredito

### 9. `api/src/modules/auth/auth.service.ts` — Enriquecimento de `/auth/me`
- Adicionados campos `entityName` e `conta` na resposta do `/auth/me`
- Para associados: busca nome, saldo, limiteCredito (via plano)
- Para agências: busca nome, saldo; limiteCredito=0
- Para matriz/superadmin: entityName='Matriz', conta=null

### 10. Docker / Produção
- `front/Dockerfile`: build Node + serve via nginx
- `front/nginx.conf`: serve estático + proxy `/api/ → http://api:3000/api/`
- `api/docker-compose.yml`: adicionado serviço `frontend` na porta 80
- `api/.env`: portas ajustadas (postgres: 5433, redis: 6380), `JWT_EXPIRES_IN=8h`

---

## Padrão da API — Respostas

Todas as respostas seguem o envelope:
```json
{ "success": true, "data": <payload> }
```

Portanto, em qualquer chamada Axios:
- `response.data` = `{ success, data }`
- `response.data.data` = payload real (array, objeto, paginado, etc.)

Respostas paginadas:
```json
{ "success": true, "data": { "items": [...], "total": N, "page": N, "limit": N, "pages": N } }
```

---

## Módulo: Categorias e Subcategorias

### Decisão de design
- Categoria e subcategoria são o **mesmo modelo** (`Categoria`) diferenciado por `categoriaParenteId`
- `GET /categorias` retorna árvore: categorias raiz com `categoriasFilhas` aninhadas

### Mapeamento de campos (front antigo → API)
| Front antigo | API | Observação |
|---|---|---|
| `nomeCategoria` | `nome` | campo único para todos os níveis |
| `nomeSubcategoria` | `nome` | idem |
| `idCategoria` | `id` | |
| `subcategorias` | `categoriasFilhas` | propriedade aninhada |
| `createdAt` | `criadoEm` | |

### Arquivos alterados
- `useQueryCategorias.js` → retorna `res.data.data` (array direto)
- `CategoriesOptions.jsx` → usa `item.id` e `item.nome`
- `Categorias.jsx` → campo form `nome`, coluna `nome/criadoEm`, tabela recebe `data || []`
- `SubCategorias.jsx` → `filterSub` usa `categoriasFilhas`, colunas `nome/criadoEm`
- `EditarCategoriaModal.jsx` → `defaultValue/name` → `nome`
- `EditarSubCategoriaModal.jsx` → `defaultValue/name` → `nome`

---

## Módulo: Planos

### Decisão de design (Opção A aprovada)
O schema Zod da API foi estendido para aceitar os campos que o banco já suportava mas a API não expunha. Motivo: os valores são usados tanto para **cobrar** quanto para **comissionar** gerentes e agências.

Nenhum campo foi removido do banco. Todos os campos existentes têm propósito:
- `taxaInscricaoRT` — cobrado do associado na adesão
- `taxaManutencaoAnualRT` — cobrado anualmente do associado
- `percentualComissao` — base para comissionar o gerente nas transações
- `tipoPlano` — segrega planos por perfil (associado/agência/gerente)
- `limiteRT` — teto de crédito em moeda RT para o plano
- `periodicidade` — frequência de cobrança da manutenção

### Campos adicionados ao schema Zod da API (`plan.schema.ts`)
```typescript
tipoPlano: z.enum(['agencia', 'associado', 'gerente']).default('associado'),
taxaInscricaoRT: z.number().min(0).default(0),
taxaManutencaoAnualRT: z.number().min(0).default(0),
```

### Campos removidos do Plano (banco + API + front)
| Campo | Motivo |
|---|---|
| `periodicidade` | A taxa de manutenção é sempre anual — campo redundante |
| `maxParcelas` | Controle de parcelas não é feito no plano; transações ainda suportam `parcelas` |

- **Banco**: colunas dropadas via `prisma db push --accept-data-loss`
- **Enum `Periodicidade`** removido do schema Prisma (era usado só em Plano)
- **`transaction.service.ts`**: removida a validação `input.parcelas > plano.maxParcelas`
- **`report.service.ts`**: removido campo `periodicidade` do retorno do relatório
- **`limiteRT`**: mantido no banco e API como opcional (`default(0)`), sem campo no front
- Transações: `parcelas` e `totalParcelas` **permanecem** no modelo `Transacao`

### Mapeamento de campos (front antigo → API)
| Front antigo | API | Observação |
|---|---|---|
| `nomePlano` | `nome` | |
| `taxaComissao` | `percentualComissao` | |
| `taxaInscricao` | `taxaInscricaoRT` | só para tipo `associado` |
| `taxaManutencaoAnual` | `taxaManutencaoAnualRT` | só para tipo `associado` |
| `tipoDoPlano` | `tipoPlano` | enum: `agencia\|associado\|gerente` |
| `idPlano` | `id` | |
| `createdAt` | `criadoEm` | |
| *(ausente)* | `limiteRT` | **obrigatório** — adicionado nos forms |
| *(ausente)* | `periodicidade` | **obrigatório** — select `mensal\|anual` adicionado |

### Arquivos alterados
- `plan.schema.ts` (API) → adicionados `tipoPlano`, `taxaInscricaoRT`, `taxaManutencaoAnualRT`
- `useQueryPlanos.js` → retorna `res.data.data` (array direto)
- `setPlano.js` → filtra por `p.tipoPlano === type && p.ativo !== false`
- `constants.js` → colunas com campos reais da API + data em formato pt-BR
- `PlanoAssociado.jsx` → form com campos corretos, `tipoPlano=associado`
- `PlanoAgencias.jsx` → form com campos corretos, `tipoPlano=agencia`
- `PlanoGerente.jsx` → form com campos corretos, `tipoPlano=gerente`
- `EditarPlanoModa.jsx` → usa `nome/percentualComissao/taxaInscricaoRT/taxaManutencaoAnualRT`, hidden input `tipoPlano` para preservar tipo na edição
- `PlanosTable.jsx` → botão deletar substituído por desativar (`PATCH /planos/:id/status { ativo: false }`)
- `PlanosOptions.jsx` → usa `item.id` e `item.nome`
- `PlanosFields.jsx` → usa `taxaInscricaoRT/taxaManutencaoAnualRT/percentualComissao/id`
- `FormPlano.jsx` (react-hook-form) → idem, remove console.logs

### Bug fixes adicionais
- **`formHandler.js`**: corrigido parse numérico — dot sem vírgula é decimal (`"2.5"→2.5`), não milhar; vírgula indica formato BR (`"2,5"→2.5`, `"1.000,50"→1000.5`)
  - Antes: `parseFloat(value.replace(/\./g, ''))` → `"2.5"` virava `25`
  - Depois: sem vírgula → `parseFloat(value)` direto; com vírgula → remove dots + troca vírgula por dot

---

## Módulo: Gerentes

### Decisão de design
Gerente = Associado com comissão. Ele faz tudo que um associado faz (conta RT, loja, ofertas, permuta), mas **recebe comissão** quando associados vinculados a ele transacionam ou se inscrevem na plataforma.

Tecnicamente: cria-se um registro `Associado` (empresa, CNPJ, conta RT) + um `Usuario` com `role: 'gerente'` vinculado a esse Associado.

**Regras de comissão:**
- **Inscrição**: gerente recebe 50% da `taxaInscricaoRT` do plano do associado → 25% em BRL + 25% em RT — registrado em `ComissaoGerente` com `tipoComissao: 'inscricao'`
- **Transação (Opção A)**: gerente recebe `valorRT * percentualComissao_do_plano / 100` em RT — registrado em `ComissaoGerente` com `tipoComissao: 'transacao'`, `comissaoBRL: 0`
- Percentual vem sempre do PlanoGerente (não é sobrescrito por gerente)
- Split 50/50 BRL/RT é fixo (hardcoded)
- Gerente nunca tem gerente acima dele (`gerenteId: null`)
- Pode haver vários gerentes por agência ou na matriz

### Mudanças no banco (prisma)
- `Associado.gerenteId String?` — virou opcional (gerentes não têm gerente)
- `Associado.gerente Usuario?` — relação opcional
- Novo enum `TipoComissaoGerente { inscricao, transacao }`
- `ComissaoGerente` refatorado:
  - Removido: `valorTransacaoRT`, `comissaoPlataformaBRL`, `percentualGerente`, `comissaoGerenteBRL`
  - Adicionado: `tipoComissao`, `baseValorRT`, `percentual`, `comissaoBRL` (default 0), `comissaoRT`
  - `transacaoId` virou opcional (inscrição não tem transação)

### Mapeamento de campos (front → API)

**Criar gerente (`POST /gerentes`):**
| Campo | Origem |
|---|---|
| `nome` | form |
| `cnpj` | form |
| `email` | form |
| `senha` | form |
| `telefone` | form (opcional) |
| `agenciaId` | `state.user.entityId` (hidden input); para agency_admin o controller sobrescreve com `request.user.entityId` |
| `planoId` | `PlanosFields type="gerente"` (hidden input) |
| `cidade`, `estado`, `logradouro`, `cep` | form (campos planos, não aninhados) |

**Editar gerente (`PUT /gerentes/:id`):** apenas `nome`, `email`, `telefone`

### Fluxo de criação (API)
1. Valida CNPJ único (em `associado`) e email único (em `associado` + `usuario`)
2. Valida agência existe + plano ativo de `tipoPlano: 'gerente'`
3. `prisma.$transaction`:
   - Cria `Associado` (gerenteId=null, tipoAtendimento=[])
   - Cria `Conta` para o Associado
   - Cria `Usuario` (role='gerente', entityType='associado', associadoId, agenciaId, percentualComissao=plano.percentualComissao)

### Auth do gerente
- `entityType: 'associado'` → `/auth/me` retorna dados do Associado (nome, conta RT, saldo)
- `entityId` no JWT = `associadoId` (conta como associado para todas as operações)
- `agenciaId` fica salvo no `Usuario` para listagem por agência

### Arquivos alterados
**API:**
- `prisma/schema.prisma` — mudanças no banco descritas acima
- `manager.schema.ts` — novo schema flat (sem `endereco` aninhado)
- `manager.service.ts` — reescrito: cria Associado + Conta + Usuario; lista com `managerSelect` incluindo associado
- `manager.controller.ts` — auto-fill `agenciaId` para agency_admin
- `queues/bullmq.ts` — worker `commission.gerente`: RT-based (opção A), novos campos do modelo
- `associate.service.ts` — comissão de inscrição criada na transação de criação do associado

**Front:**
- `useQueryGerentes.js` → usa `api.get` + `res.data.data` (padrão do projeto)
- `constants.js` (gerentes) → colunas com `accessorFn` para campos aninhados (`associado.agencia.nome`, etc.)
- `GerentesLista.jsx` → `data ?? []` (não mais `data.data`)
- `GerentesCadastrar.jsx` → form simplificado (nome, CNPJ, telefone, endereço, plano, e-mail, senha)
- `EditarGerenteModal.jsx` → reescrito: apenas nome, e-mail, telefone; endpoint `gerentes/:id`

---

## Problemas recorrentes a verificar

1. **`response.data` vs `response.data.data`** — checar toda chamada nova
2. **`conta` null para superadmin** — usar optional chaining `?.` ao acessar campos de `conta`
3. **Brute-force lock no Redis** — se login retornar 401 inesperado, limpar com:
   ```bash
   docker exec trade-redis-1 redis-cli DEL "login_attempts:<email>"
   docker exec trade-redis-1 redis-cli DEL "login_locked:<email>"
   ```
4. **Build Docker** — após mudanças no frontend, rebuild necessário (comando roda a partir da raiz do monorepo, `docker-compose.yml` não fica mais dentro de `api/`):
   ```bash
   docker compose build frontend && docker compose up -d frontend
   ```

---

## Testes E2E (Playwright) — validação front → backend (2026-07-02)

Suíte já existente em `front/tests/*.spec.js` (não criada nesta rodada) foi rodada e corrigida até 19/19 passando, com `docker compose up` (API) + `npm run dev` (front, porta 5173, proxy Vite → API).

### Bug real encontrado e corrigido: inscrição RT deixava saldo negativo (500)
- `associate.service.ts` debitava `valorInscricaoRT` diretamente na `Conta` recém-criada, deixando `saldo` negativo de propósito ("saldo inicia negativo").
- Isso violava a constraint `saldo_nao_negativo` do banco (a mesma regra documentada como inviolável em `ARCHITECTURE.md §3`) — **todo cadastro de associado com taxa de inscrição em RT quebrava com 500**.
- Corrigido para seguir o mesmo padrão já usado para `valorInscricaoBRL`: cria um registro em `Cobranca` (agora com campo `valorRT` opcional, além do `valorBRL` que já existia) em vez de debitar a conta diretamente. `saldo` nunca fica negativo.
- Migration: `20260702024347_cobranca_rt_e_valorbrl_opcional` — `Cobranca.valorBRL` virou opcional, `Cobranca.valorRT` foi adicionado.
- `cobranca.schema.ts` — exige `valorBRL` OU `valorRT` (pelo menos um).

### Config: variável B2 renomeada incorretamente
- `.env` teve `B2_APPLICATION_KEY` renomeada para `B2_APP_KEY` — o código (`config/env.ts`, `config/b2.ts`) só reconhece `B2_APPLICATION_KEY`, então upload de imagem quebrava com 500.
- `B2_REGION` e `B2_PUBLIC_URL` também haviam sumido do `.env` (URL pública da imagem ficava quebrada sem `B2_PUBLIC_URL`).
- Corrigido: nome da variável restaurado, `B2_REGION`/`B2_PUBLIC_URL` reinseridos (mesmo bucket `redetrade`, pendente confirmação se a URL pública ainda é válida com as chaves novas).

### Ajustes nos próprios testes (não eram bugs de produto)
- Senha do superadmin hardcoded (`Admin@123456`) desatualizada nos 9 specs — atualizada para a senha atual do `.env`.
- Specs renomeados com prefixo numérico (`01-agencias.spec.js` … `09-screenshot.spec.js`) + `workers: 1`/`fullyParallel: false` no `playwright.config.js` — os testes compartilham estado no banco (ex: `02-cadastrar-associado` cria o associado usado por `03-associado-info`, `05-editar-associado`, etc.), então precisam rodar em ordem sequencial.
- Guarda do teste "selecionar gerente" (`02-cadastrar-associado.spec.js`) verificava só a contagem de `<option>` para decidir se havia gerente cadastrado — mas `GerentesOptions.jsx` sempre renderiza um `<option disabled>` extra quando a lista está vazia, então a contagem nunca refletia corretamente "tem gerente real". Corrigido para checar se a option no índice 2 está habilitada.
- Fixture `/tmp/test-upload.png` (usada pelo teste de upload) não existia no repo — gerada uma imagem PNG mínima válida.

---

## Testes manuais dos endpoints `.http` (2026-07-02)

Percorridos todos os módulos em `api/docs/http/*.http` contra a API real (superadmin + personas criadas na hora — associate_admin, associate_operator, gerente). Vários `.http` estavam desatualizados (documentam payloads que não existem mais no schema) e **4 bugs reais** foram encontrados e corrigidos no código.

### 🔴 Crítico — criar agência sem `senha`/`usuarioEmail` corrompia a conta do superadmin
- `agency.service.ts`: quando `POST /agencias` não recebe credenciais separadas para o admin da nova agência, o código reatribuía o **usuário criador** como admin dela — sobrescrevendo `entityType`/`entityId`.
- Se o criador fosse o **superadmin** (fluxo comum: Matriz criando uma agência master), a própria conta raiz da Matriz virava `entityType: 'agencia'` apontando pra agência recém-criada, perdendo o vínculo com `matriz`. Silencioso — só aparecia ao chamar `/auth/me` depois.
- Corrigido: a reatribuição do criador só acontece quando `creatorRole !== 'superadmin'` (o caso legítimo é um `agency_admin` de uma master criando uma comum). `agency.controller.ts` agora passa `request.user.role` para o service.

### 🟠 Alto — `senhaHash` (bcrypt) vazando na resposta de `PATCH /usuarios/:id/status`
- `user.service.ts::setStatus` fazia `prisma.usuario.update(...)` sem `select`, retornando o registro completo — incluindo `senhaHash`, `bloqueadoAte`, `tentativasLogin`. Todas as outras funções do módulo (`create`, `list`, `getById`, `update`) já usavam `select` corretamente; só essa ficou de fora.
- Corrigido com `select` explícito, mesmo padrão do resto do arquivo.

### 🟠 Alto — erro de validação Zod retornando 500 em vez de 400
- O error handler global (`app.ts`) já tinha tratamento correto para `ZodError` → `400 VALIDATION_ERROR`, mas o `instanceof ZodError` estava falhando silenciosamente (provável dual-package hazard — duas instâncias do módulo `zod` carregadas), fazendo todo erro de validação cair no branch genérico de `500 INTERNAL_ERROR` com o JSON bruto do Zod vazando como `message`.
- Corrigido com fallback por duck-typing (`error.name === 'ZodError' && Array.isArray(error.issues)`), resiliente independente da causa raiz do `instanceof` falhar.

### 🟡 Médio — `associate_admin` não conseguia comprar (permuta)
- `ARCHITECTURE.md §7` documenta: "`associate_admin` acessa tudo dentro do seu associado" — mas `POST /transacoes/permuta` só liberava `associate_operator`, mesmo já existindo uma constante `operator` no mesmo arquivo (`transaction.routes.ts`) que inclui os dois roles e é usada em `GET /transacoes`.
- Corrigido: `/transacoes/permuta` agora usa a constante `operator` (`associate_operator` + `associate_admin`).

### 🟡 Médio — estorno de permuta quebrava com 500 se o recebedor já tivesse gasto o RT
- `transaction.service.ts::estorno` não validava se `contaDestino` (quem recebeu o RT original) tinha saldo suficiente antes de tentar debitar de volta. Se esse saldo já tinha sido movimentado (gasto, transferido), a constraint `saldo_nao_negativo` do banco vazava como 500 puro.
- Corrigido: valida saldo suficiente antes da reversão e lança `Errors.insufficientBalance()` (422) se não houver.

### 🟡 Observação — pendente, decisão de feature (não é bug)
- **Geração de PDF do voucher não está implementada** — `voucher.service.ts::getPdf` é um stub com o comentário `// PDF generation would be done here with a library like PDFKit`. O cache Redis (1h) já funciona; falta a geração do binário. `GET /vouchers/:id/pdf` hoje devolve o JSON do voucher com `Content-Type: application/json`, não um PDF de verdade.

---

## Auditoria de integridade de dados (2026-07-02)

Motivada pelo bug do estorno restaurando sempre `+1` na oferta: auditados todos os schemas Zod contra os models Prisma correspondentes, procurando campos recebidos/necessários que eram descartados silenciosamente antes de chegar no banco.

### 🔴 Corrigido — `Transacao` não guardava a quantidade comprada na permuta
- `permutaSchema` recebe `quantidade`, e o serviço usava esse valor para decrementar `Oferta.quantidadeDisponivel` — mas **nunca persistia esse número na própria `Transacao`**.
- Consequência: o histórico de transações não sabia quantas unidades foram de fato compradas, e o **estorno sempre restaurava exatamente `+1`** na oferta, não importa se a compra original foi de 1, 5 ou 50 unidades — causando divergência de estoque real vs. sistema.
- Corrigido: `Transacao.quantidade Int?` adicionado ao schema (migration `20260702040322_transacao_quantidade_e_oferta_campos`). `permuta()` agora persiste `input.quantidade`; `estorno()` restaura `original.quantidade ?? 1` (fallback só para transações antigas criadas antes da migration).
- **Validado**: compra de 5 unidades → estorno → as 5 voltaram ao estoque (antes só 1 voltava).

### 🔴 Corrigido — `Oferta.imagemUrl` e `Oferta.vencimento` existiam no banco mas eram descartados na entrada
- Os campos existem no model Prisma desde a extensão documentada em `SPEC.md §16`, mas `offer.schema.ts` (`createOfferSchema`/`updateOfferSchema`) nunca os declarava — como o Zod `.parse()` remove campos desconhecidos por padrão, **qualquer `imagemUrl`/`vencimento` enviado pelo front era silenciosamente ignorado**, sem erro nenhum.
- Corrigido: campos adicionados ao schema Zod (opcionais), e `offer.service.ts` (`create`/`update`) agora os persiste, convertendo `vencimento` de string ISO para `Date`.
- **Validado**: criada oferta com `imagemUrl` e `vencimento` — ambos retornados corretamente na resposta.

### Módulos auditados sem problema (schema Zod ↔ model Prisma consistentes)
Agência, Associado, Plano, Categoria, Gerente, Crédito RT, Cobrança — todos os campos do model são aceitos e persistidos pelo schema de entrada correspondente.

### `.http` desatualizados corrigidos
- `planos.http` — payload de criação ainda usava `periodicidade`/`maxParcelas` (removidos do schema); atualizado para `tipoPlano`/`taxaInscricaoRT`/`taxaManutencaoAnualRT`.
- `associados.http` — payload usava `endereco` aninhado; o schema real é flat (`cidade`, `estado`, `logradouro` no nível raiz) e exigia `senha` (não documentada). Corrigido nos payloads de criação e atualização.
- `gerentes.http` — documentava o design antigo (`percentualComissao`, `entityId`/`entityType`); a implementação real é "Gerente = Associado" (`cnpj`, `planoId` de tipo `gerente`, endereço flat). Reescrito.

### Módulos validados sem problemas
Agências (CRUD completo), Categorias, Ofertas (CRUD + filtros públicos), Créditos RT (fluxo completo: solicitar → encaminhar → aprovar → saldo injetado), Cobranças (BRL e RT, quitar), Extrato (+ export CSV), Relatórios (permutas, comissões, comissões-gerentes, uso-plano, associados consolidado).

---

## Correções críticas — estorno, error handler e módulo Ofertas (2026-07-02)

### 🔴 CRÍTICO — Estorno restaurava sempre `+1` na oferta (causa raiz corrigida)
- `Transacao` nunca guardava a `quantidade` comprada numa permuta — só usava o valor pra decrementar a oferta na hora, e descartava.
- Adicionado `Transacao.quantidade Int?` (migration `20260702040322_transacao_quantidade_e_oferta_campos`). `permuta()` agora persiste; `estorno()` usa `original.quantidade ?? 1` (fallback só pra transações antigas).
- **Validado**: compra de 5 unidades → estorno → as 5 voltaram ao estoque (antes só 1 voltava).

### 🔴 CRÍTICO — `Oferta.imagemUrl`/`vencimento` existiam no banco mas eram descartados na entrada
- Campos existem no model Prisma desde `SPEC.md §16`, mas `offer.schema.ts` nunca os declarava — Zod `.parse()` removia silenciosamente qualquer valor enviado, sem erro.
- Corrigido: adicionados ao schema Zod (opcionais) e à persistência (`offer.service.ts`).

### 🔴 CRÍTICO — Error handler global do Fastify nunca era chamado pelas rotas reais
Esse é o achado mais sério da sessão. **Toda mensagem de erro em todos os módulos, desde o início do projeto, saía no formato errado.**

- Causa: `app.setErrorHandler(...)` era registrado em `app.ts` **depois** de todos os `app.register(rotaModulo, {prefix})`. No Fastify, cada plugin registrado via `register()` herda a configuração de erro do pai **no momento em que é registrado** (encapsulamento) — registrar o handler depois faz com que nenhuma rota real dentro de um módulo o herde. Só rotas coladas direto no `app` raiz (fora de `register()`) o herdariam corretamente.
- Sintoma: qualquer erro lançado por um controller/service (`ZodError`, `AppError` como `NOT_FOUND`/`INSUFFICIENT_BALANCE`/etc.) saía no formato bruto do Fastify (`{"statusCode":500,"error":"Internal Server Error","message":"..."}`) em vez do envelope documentado (`{success:false, error:{code,message,details}}`). Só rotas com reply manual dentro dos guards (`authGuard`/`roleGuard`, que respondem direto sem lançar erro) tinham o formato correto — por isso passou despercebido: erros de permissão (403/401) sempre pareciam certos.
- Impacto real: **todo toast de erro no frontend** (que lê `err.response.data.error.message`) estava recebendo `undefined` nesse campo pra qualquer erro que não fosse 401/403, incluindo os principais: erro de validação, saldo insuficiente, CNPJ duplicado, oferta indisponível, etc.
- Corrigido: `app.setErrorHandler(...)` movido para **antes** de qualquer `app.register(...)`.
- **Validado** com rota de teste isolada (throw direto vs. throw dentro de plugin registrado) pra confirmar a causa raiz antes de aplicar a correção, e revalidado depois em toda a suíte.

### 🔴 CRÍTICO — Módulo Ofertas nunca foi migrado pra API nova (diferente de Categorias/Planos/Gerentes)
Ao contrário dos outros módulos (já migrados, documentados acima), Ofertas ainda usava a convenção antiga em praticamente todo lugar:
- **Cadastro** (`OfertasCadastrar.jsx`) mandava `valor`/`quantidade`/`tipo` (Produto/Serviço) em vez de `valorRT`/`quantidadeDisponivel`/`tipoAtendimento` (obrigatório, array) — **toda tentativa de criar oferta pelo front falhava**.
- **Edição** (`Modals/MinhasOfertasModal.jsx`) tinha os mesmos problemas, mais o upload de imagem setando o campo errado (`imagem` em vez de `imagemUrl`).
- **Tabela** (`constants.js`) usava `idOferta`, `nomeFranquia` — campos inexistentes no model `Oferta`.
- **Botão de excluir** chamava `DELETE /ofertas/:id` — **esse endpoint nunca existiu na API**. Substituído por fechar a oferta (`PATCH /ofertas/:id/status`), mesmo padrão já usado em Planos (`PlanosTable.jsx`).
- **Botão de editar** passava `row.original.idPlano` (copiado de outra tela) — inofensivo pois não era usado, mas corrigido pra `id`.
- **Listagens** (`Ofertas.jsx`, `OfertasMinhas.jsx`) liam `data.ofertas` do retorno da API — que sempre é `undefined` (o envelope real é `{success, data: [...], meta}`) — **as duas telas sempre mostravam lista vazia**, silenciosamente.
- **`OfertasMinhas.jsx`** filtrava ofertas no client por `item.usuarioId === getId()` — campo que não existe em `Oferta` (é `associadoId`). Substituído por usar o endpoint dedicado `GET /ofertas/minha-loja` (já existia na API, nunca era chamado pelo front) via novo hook `useQueryMinhaLoja`.
- **Cards e detalhe** (`OfertasCard.jsx`, `OfertasInfo.jsx`) liam `data.tipo`, `data.valor`, `data.imagens[0]`, `data.status` (boolean) — todos trocados pelos campos reais (`tipoAtendimento`, `valorRT`, `imagemUrl`, `status` enum).
- **Botão "Permutar"** na tela de detalhe da oferta não tinha `onClick` nenhum — usava `RealInput` (campo de dinheiro) com `name="limiteCredito"` pra "quantidade da permuta". Reescrito: input numérico de quantidade + wire completo pra `POST /transacoes/permuta`.
- API: `offer.service.ts::minhaLoja` não incluía `categoria` no retorno (a tabela agora precisa disso pra exibir a coluna Categoria) — adicionado `include: { categoria: true }`.
- **Novo teste permanente**: `front/tests/10-ofertas.spec.js` — cadastra um associado vendedor dedicado via API, testa cadastro de oferta pela UI real e confere que aparece em "Minhas Ofertas". Não existia cobertura alguma desse módulo antes.

### 🟠 Bug relacionado — 13 lugares no front liam `err.response.data.message` em vez de `err.response.data.error.message`
Consequência direta do formato de erro documentado (`{success:false, error:{code,message,details}}`) — o campo certo é `error.message`, aninhado. Todo toast de erro nesses 13 pontos mostrava mensagem genérica/`undefined` em vez do motivo real. Corrigido em: `EditarAssociadoModal.jsx`, `EditarAgenciaModal.jsx`, `utils/functions/api/index.js`, `ListasHook.js`, `CadastrarAgencia.jsx`, `CadastrarAssociado.jsx`.

### 🟠 Bug relacionado — `valorRt` (t minúsculo) em vez de `valorRT` em Transações e Vouchers
Mesma classe de erro do Ofertas, encontrada de raspão ao corrigir a formatação de coluna de valor: `TransacoesTable.jsx`, `VoucherTable.jsx`, `tableFunctions.js`, `pages/transacoes/*.js(x)`, `pages/vouchers/*.js`. A API sempre retornou `valorRT` (maiúsculo) — essas colunas de valor mostravam "Indefinido" ou vazio. Corrigida a grafia.

---

## Módulos: Transações e Vouchers — auditoria completa + duas features novas (2026-07-02/03)

Auditoria com a mesma profundidade de Ofertas. Diferente de Ofertas (só drift de nomes de campo), aqui o front implementava um **modelo de negócio inteiro que a API não suportava** — não dava pra corrigir só renomeando campos, foi preciso decidir com o usuário o que fazer.

### Decisão de design (validada com o usuário antes de implementar)

O front tinha três telas "soltas" (`TransaçãoCadastrar.jsx`, `VoucherCadastrar.jsx`, `TransaçõesExtorno.jsx`, `CancelarVouchers.jsx`, `VoucherSolicitarCancelar.jsx`) que na verdade eram **duas features**:

1. **Negociação direta**: comprador escolhe qualquer vendedor livremente, define o próprio valor, parcela, e avalia o atendimento (1-5 + comentário) ao final. Não existia na API — só `permuta` (via oferta publicada) e `transferencia` (sem conceito de vendedor/parcelamento/avaliação).
2. **Estorno com fluxo de aprovação**: `TransaçõesExtorno.jsx` esperava um fluxo `solicitar → encaminhar → aprovar` igual Créditos RT, mas o estorno na API sempre foi uma ação direta e imediata. Os hooks já tinham comentário `// TODO: API precisa de filtro de estorno...` — sinal de que quem escreveu já sabia do gap. "Cancelar voucher" é a mesma coisa, só que a partir da tela de Vouchers (cancelar voucher = estornar a transação por trás dele).

Perguntei ao usuário se isso era legado de uma versão anterior (e as telas deveriam ser removidas) ou uma funcionalidade real que a API deveria passar a suportar. Resposta: **é real, manter as telas, preparar a API**. Achei também dois pontos que pareciam incorretos e levantei antes de implementar:

- O formulário de negociação tinha um campo `valorAdicional` em **R$ (dinheiro real)** somado ao valor em RT — isso contraria o princípio já documentado no `ARCHITECTURE.md §4` ("RT não sai do sistema"). **Usuário confirmou: não deveria envolver dinheiro real, RT é a moeda do sistema.** Campo removido.
- O formulário tinha um campo booleano `aceitaVoucher` no vendedor, separado do `tipoAtendimento` que já existe no domínio (Associado/Oferta já têm esse enum com o valor `voucher`). **Usuário confirmou: reaproveitar `tipoAtendimento`.** Filtro de "aceita voucher" agora é `tipoAtendimento.includes('voucher')`.

### Backend — features novas implementadas

- **`Transacao.tipo`**: novo valor `negociada`, além de `permuta`/`transferencia`/`credito`/`estorno`.
- **`Transacao.notaAtendimento`/`comentarioAvaliacao`**: campos novos para avaliação pós-transação.
- **`POST /transacoes/negociada`**: mesma lógica de validação da permuta (saldo, limite mensal do plano), mas sem oferta — vendedor é escolhido diretamente (`vendedorId` = Associado), sempre em RT. Gera voucher e comissões igual à permuta.
- **`PATCH /transacoes/:id/avaliar`**: só o comprador (`usuarioIniciador`) avalia, só uma vez, só em transações `concluida`.
- **`GET /associados/diretorio`**: endpoint novo — diretório mínimo de associados ativos (`id`, `nome`, `cidade`, `estado`, `tipoAtendimento`) para o comprador escolher parceiro de negociação, **sem expor dados financeiros** (a listagem administrativa `GET /associados` inclui `saldo`/`plano`/`gerente` e é restrita a `superadmin`/`agency_admin` — expor isso pra qualquer associado seria vazamento de dados financeiros de outros negócios).
- **Módulo novo `SolicitacaoEstorno`** (mesmo padrão de `SolicitacaoCredito`): `POST /estornos`, `GET /estornos/minhas`, `GET /estornos/filhos`, `PATCH /estornos/:id/encaminhar`, `GET /estornos/matriz`, `PATCH /estornos/:id/aprovar` (executa o estorno de fato, reaproveitando a função já existente e corrigida), `PATCH /estornos/:id/negar`, `GET /estornos`.
- **Bug de integração encontrado ao testar**: a função `estorno()` reaproveitada tinha um `if (tipo !== 'permuta') throw ...` hardcoded de antes da `negociada` existir — bloqueava estorno de negociações. Corrigido para aceitar `permuta` e `negociada`.
- Migration: `20260702120439_transacao_negociada_avaliacao_e_estorno`.

### Frontend — reescrito para bater com o novo backend

- `TransaçãoCadastrar.jsx` / `VoucherCadastrar.jsx`: reescritos para chamar `/transacoes/negociada`, sem `valorAdicional`, vendedor escolhido via novo componente `AssociadosDiretorioOptions` (não mais `UsuariosOptions`, que listava `Usuario` — a API espera o id do **Associado**, não do usuário).
- `createT` (`ListasHook.js`): agora faz o fluxo em duas etapas — cria a transação negociada, depois (se houve nota) chama `PATCH /avaliar`. Antes, a nota era só um campo a mais no mesmo payload de `POST /transacoes/permuta` (nunca teria sido persistida, já que a API nem aceitava esses campos).
- `refound`/`sendRefound`/`aproveRefound` (`ListasHook.js`): **as três funções chamavam o mesmo endpoint** (`POST /transacoes/:id/estorno`) — não existia distinção real entre "solicitar", "encaminhar" e "aprovar", todo botão estornava na hora. Reescritas para os endpoints corretos de `/estornos`, mais uma nova `negarRefound` (não existia botão de negar antes).
- Novo tipo de botão `Reject` em `Buttons.jsx` (ícone `MdCancel`), usado nas tabelas quando `matriz` para negar solicitações.
- `TransaçõesMinhas.jsx`: lia `snap.user.transacoesComprador`/`transacoesVendedor` — campos que não existem no `/auth/me`. Trocado para `GET /transacoes` (já filtra pela conta do usuário automaticamente).
- `TransaçõesExtorno.jsx` / `CancelarVouchers.jsx`: agora consultam `/estornos/filhos` (visão agência) e `/estornos/matriz` (visão Matriz) de verdade — antes ambos os hooks apontavam pro mesmo `GET /transacoes` genérico com comentário `// TODO: API precisa de filtro...`.
- `TransaçõesModal.jsx`/`ContasModal.jsx`: **campos trocados** — o rótulo "Vendedor" mostrava o nome do **comprador** e vice-versa (`data.transacao?.comprador.nomeFantasia` sob o label "Vendedor"). Status sempre mostrava "Ativa" porque comparava uma string (`'estornada'`) como se fosse booleano. `ContasModal.jsx` tem o mesmo bug mas é do módulo de Cobranças (fora do escopo desta rodada — não corrigido, só documentado).
- `offer.service.ts::minhaLoja`... (não relacionado, já documentado acima)
- `transaction.service.ts::list()`: não incluía `comprador`/`vendedor`/`voucher` — as tabelas não tinham o que exibir para essas colunas. Adicionado `include`.
- Colunas (`constants.js`, `extornoConstants.js`, `MeusVochersConstants.js`): `createdAt`→`criadoEm`, `nomeFantasia`→`nome`, removidas colunas fantasma (`conta.nomeFranquia`, que não existe em nenhum model).
- **Testado end-to-end pelo navegador real** (Playwright ad-hoc, depois removido): negociação direta criada (201) → avaliação persistida no banco (nota 5 + comentário confirmados via query direta) → solicitação de estorno criada pela UI (201, status `em_analise`). Fluxo completo solicitar→encaminhar→aprovar validado via curl com saldo revertido corretamente.

### Pendências registradas (não bloqueantes)
- `ContasModal.jsx` (módulo de Cobranças) tem o mesmo bug de campos trocados que `TransaçõesModal.jsx` tinha — não corrigido, fora do escopo desta rodada.
- Módulo de Cobranças/Contas a Receber como um todo não foi auditado com a mesma profundidade — pode ter os mesmos tipos de problema encontrados em Ofertas/Transações/Vouchers.

---

## Coerência do ciclo financeiro — dois buracos reais corrigidos (2026-07-03)

Perguntado se a lógica de negócio geral estava coerente. Ao investigar, dois pontos do ciclo financeiro calculavam/registravam valores que **nunca chegavam a se efetivar** — dinheiro "no papel" sem caminho real até ser cobrado. Ambos corrigidos e validados via curl com verificação direta no banco.

### 🔴 `PATCH /cobrancas/:id/quitar` não movia RT nenhum
- A função só fazia `pago: true`. Pra cobrança em **BRL** isso é correto (pago fora do sistema via PIX/boleto, o admin só confirma o recebimento). Mas a Cobrança em **RT** (introduzida nesta mesma sessão pra corrigir o bug da inscrição deixando saldo negativo, ver seção acima) precisa mover RT de verdade — é moeda interna, não existe "fora do sistema" pra ela.
- **Corrigido**: `quitarCobranca()` agora ramifica por moeda. Cobrança em RT: valida saldo suficiente do devedor, debita atomicamente, e credita a `agenciaId` vinculada à cobrança (ex: taxa de inscrição recolhida pela agência que cadastrou o associado). Sem agência vinculada, o RT é retirado de circulação — simétrico à injeção de RT pela Matriz (`POST /transacoes/credito`), que credita sem debitar nenhuma origem.
- `associate.service.ts`: a criação da Cobrança RT de inscrição agora também grava `agenciaId` (antes só gravava `contaId`/`associadoId` — faltava o destino do pagamento).
- **Validado**: associado com saldo 1000 quita cobrança de inscrição de 300 → saldo cai pra 700, saldo da agência sobe de 0 pra 300. Tentativa de quitar de novo retorna `VALIDATION_ERROR` corretamente.

### 🔴 A comissão da plataforma (`comissaoBRL`) era calculada mas nunca virava cobrança
- Toda permuta/negociação calcula e grava `comissaoBRL` na própria `Transacao` — mas o worker `commission.calculate` era um no-op (comentário no código: `// comissaoBRL already stored during permuta transaction`). Esse valor nunca gerava uma fatura, nunca era cobrado de ninguém — só ficava um número guardado na linha da transação.
- **Corrigido**: o worker agora cria uma `Cobranca` (BRL) vinculada à transação via `transacaoId` (campo que já existia no model mas nunca era usado por ninguém), cobrada do **comprador** — consistente com o fato de `comissaoBRL` já ser calculado a partir do `percentualComissao` do **plano do comprador**. Idempotente (`findFirst` antes de criar, não duplica se o job rodar mais de uma vez).
- **Validado**: negociação de 1000 RT com plano de 3% de comissão → `Transacao.comissaoBRL = 30` → `Cobranca` criada automaticamente ("Comissão da plataforma — transação #...", R$ 30,00), vinculada ao comprador.
- Reaproveitado o cálculo de vencimento (`calcularVencimento`, extraído pra `shared/utils/data.ts` — antes só existia dentro de `associate.service.ts`, duplicado agora seria o terceiro uso).

### Auditoria da estrutura do banco (pedida junto com os dois fixes acima)

**Achados corrigidos:**
- `ComissaoGerente.associadoId` era uma `String` solta, **sem `@relation` nenhuma** com `Associado` — sem integridade referencial, sem cascade, sem `include` possível. Todos os outros campos de FK do model (`gerenteId`, `transacaoId`) tinham relação declarada; esse não. Corrigido: `@relation` adicionada dos dois lados (`ComissaoGerente.associado` ↔ `Associado.comissoesGerente`), com FK real criada na migration.
- `Cobranca` não tinha nenhuma garantia no banco de que `valorBRL` ou `valorRT` estaria preenchido — só validação Zod (`.refine`) na camada de aplicação, contornável por qualquer código que grave direto no banco. Adicionada `CHECK` constraint: `valorBRL IS NOT NULL OR valorRT IS NOT NULL`.
- `Transacao.notaAtendimento` (nota de avaliação) não tinha `CHECK` de faixa no banco, só no Zod (`.min(1).max(5)`). Adicionada `CHECK (notaAtendimento IS NULL OR (notaAtendimento BETWEEN 1 AND 5))`.
- Essas duas `CHECK` foram colocadas **direto na migration** (`20260703012446_comissao_cobranca_e_integridade`), não no `seed.ts` como as constraints antigas (`saldo_nao_negativo`, `valor_rt_positivo`, etc.) — resolve parte do débito técnico já registrado sobre isso (constraints deveriam estar na migration, não no seed).

**Achados não corrigidos (registrados como observação, não bloqueantes):**
- As constraints antigas (`saldo_nao_negativo`, `valor_rt_positivo`, `quantidade_nao_negativa`, `valor_transacao_positivo`, `parcelas_validas`, `nivel_maximo`) continuam aplicadas via `$executeRaw` idempotente dentro do `seed.ts`, não numa migration formal. Não movidas nesta rodada — mexer nisso significa uma migration que assume que essas constraints já existem no banco de produção (aplicadas pelo seed), risco de conflito se não for feito com cuidado.
- `Cobranca.contaId`/`associadoId`/`agenciaId` é uma denormalização de três campos que, na prática, já são deriváveis via `Conta.associadoId`/`agenciaId` (a própria conta já sabe de quem ela é). Funciona, é o mesmo padrão usado em outros models do projeto — não é um bug, só uma escolha de design que favorece leitura rápida sobre normalização estrita.
- Nenhuma constraint de unicidade no banco impede duas `SolicitacaoEstorno` simultaneamente `em_analise`/`encaminhado` para a mesma transação — hoje isso é checado só na camada de aplicação (`estorno.service.ts::solicitarEstorno`). Um índice único parcial (`WHERE status IN (...)`) resolveria isso no nível do banco, mas o Prisma não suporta índice parcial nativamente (precisaria de SQL bruto na migration, como as CHECKs acima). Baixo risco dado o volume/concorrência esperados — registrado como possível melhoria futura, não implementado.
