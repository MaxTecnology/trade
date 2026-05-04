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
   docker exec api-redis-1 redis-cli DEL "login_attempts:<email>"
   docker exec api-redis-1 redis-cli DEL "login_locked:<email>"
   ```
4. **Build Docker** — após mudanças no frontend, rebuild necessário:
   ```bash
   docker compose -f api/docker-compose.yml build frontend && docker compose -f api/docker-compose.yml up -d frontend
   ```
