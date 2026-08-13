# CLAUDE.md — Rede Trade

## O que é este projeto

Sistema SaaS de permuta empresarial (troca com moeda virtual **RT — Real Trade**). Hierarquia: **Matriz → Agência Master → Agência Comum → Associado → Usuários**. A Matriz é a única emissora de RT; a moeda apenas circula internamente entre contas.

Monorepo com dois projetos:
- `api/` — REST API Node.js/Fastify/TypeScript
- `front/` — React/Vite SPA

---

## Stack

| Camada | Tecnologia |
|---|---|
| API | Fastify + TypeScript |
| ORM | Prisma + PostgreSQL |
| Cache / Filas | Redis + BullMQ |
| Auth | JWT access (8h) + refresh token httpOnly cookie |
| Storage | Backblaze B2 (API S3-compatível) |
| Frontend | React + Vite + Zustand/Valtio (store global) |
| Containerização | Docker + Docker Compose |

---

## Estrutura de pastas

```
docker-compose.yml     # na raiz — orquestra api, front, postgres, redis
docs/                  # implementation-plan.md, tech-debt.md (raiz do monorepo)

api/
  src/modules/         # auth, agency, associate, user, manager, plan,
                       # category, offer, transaction, voucher, report,
                       # account, credito, cobranca, upload, queues
  src/shared/          # guards, middleware, errors, utils, types
  prisma/schema.prisma
  prisma/migrations/   # migration formal (prisma migrate deploy no entrypoint.sh)
  docs/                # ARCHITECTURE.md, SPEC.md, SCHEMA.md, TASK.md, PATTERNS.md
  docs/http/           # arquivos .http para testar endpoints
  .env                 # secrets locais (nunca commitado)

front/
  src/
    services/api.js    # axios centralizado — usa /api/v1/ via proxy
    auth/authFunction.js
    hooks/             # ListasHook.js, getId.js, useQuery*.js
    store/             # estado global do usuário
    pages/             # dashboard, ofertas, transações, cadastros
```

---

## Padrões críticos da API

**Todas as respostas usam envelope:**
```json
{ "success": true, "data": <payload> }
```

No frontend: `response.data` = envelope, `response.data.data` = payload real.

**Respostas paginadas:**
```json
{ "success": true, "data": { "items": [...], "total": N, "page": N, "limit": N, "pages": N } }
```

**Prefixo de rota:** `/api/v1/`

**Roles:** `superadmin | agency_admin | agency_operator | gerente | associate_admin | associate_operator`

**EntityType no JWT:** `matriz | agencia | associado`

---

## Mapeamento de campos (front legado → API atual)

| Front antigo | API | Observação |
|---|---|---|
| `idUsuario` | `id` | |
| `nomeFantasia` | `entityName` | retornado pelo `/auth/me` |
| `tipo` | `role` | |
| `conta.saldoPermuta` | `conta.saldo` | |
| `conta.numeroConta` | `conta.numero` | |
| `nomePlano` | `nome` | |
| `taxaComissao` | `percentualComissao` | |
| `taxaInscricao` | `taxaInscricaoRT` | |
| `taxaManutencaoAnual` | `taxaManutencaoAnualRT` | |
| `tipoDoPlano` | `tipoPlano` | enum: `agencia\|associado\|gerente` |
| `nomeCategoria` | `nome` | |
| `subcategorias` | `categoriasFilhas` | |
| `createdAt` | `criadoEm` | |

---

## Gerente — design atual (AJUSTES.md)

Gerente = Associado com comissão. Tecnicamente: registro `Associado` + `Usuario` com `role: 'gerente'`.
- `entityType: 'associado'` no JWT → `/auth/me` retorna dados do Associado
- Comissão de inscrição: 50% da `taxaInscricaoRT` → 25% BRL + 25% RT
- Comissão de transação (Opção A): `valorRT * percentualComissao_do_plano / 100` em RT
- Comissão registrada em `ComissaoGerente` com `tipoComissao: 'inscricao' | 'transacao'`

---

## Superadmin — `conta: null`

Superadmin não tem conta RT. Todo código que acessa `conta` deve usar optional chaining:
```js
snap.user?.conta?.saldo
snap.user?.conta?.tipoDaConta?.descricao ?? snap.user?.tipoDaConta?.descricao ?? ''
```

---

## Docker — como rodar

`docker-compose.yml` vive na **raiz do monorepo** (não em `api/`) — contextos de build apontam para `./api` e `./front`.

```bash
# Subir tudo (rodar a partir da raiz do repo)
docker compose up -d

# Rebuild do frontend após mudanças
docker compose build frontend && docker compose up -d frontend

# Portas: postgres 5433, redis 6380, api 3000, frontend 80
# Containers: trade-postgres-1, trade-redis-1, trade-api-1, trade-frontend-1
```

---

## Dev local (sem Docker)

```bash
# API
cd api && npm run dev   # porta 3000

# Frontend
cd front && npm run dev  # porta 5173, proxy /api → http://localhost:3000
```

O Vite proxy em `front/vite.config.js` elimina CORS em dev.

---

## Problemas recorrentes

1. **`response.data` vs `response.data.data`** — checar toda chamada Axios nova; o envelope existe.
2. **`conta: null` para superadmin** — sempre usar `?.` ao acessar campos de conta.
3. **Brute-force lock no Redis** — se login retornar 401 sem motivo, limpar:
   ```bash
   docker exec trade-redis-1 redis-cli DEL "login_attempts:<email>"
   docker exec trade-redis-1 redis-cli DEL "login_locked:<email>"
   ```
4. **Parse de moeda** — campo monetário BR: sem vírgula → `parseFloat(value)` direto; com vírgula → remove dots + troca vírgula por ponto. Ver `formHandler.js`.
5. **Upload de imagem** — não definir `Content-Type` manualmente no axios; o boundary multipart é definido automaticamente.

---

## Documentação de referência

| Arquivo | Conteúdo |
|---|---|
| `api/docs/ARCHITECTURE.md` | Hierarquia, stack, fluxos, decisões técnicas, variáveis de env |
| `api/docs/SPEC.md` | Todos os endpoints, payloads, regras de negócio |
| `api/docs/SCHEMA.md` | Schema Prisma completo, índices, constraints, seed |
| `api/docs/PATTERNS.md` | Padrões de criação de Associado e Agência, formulários front |
| `api/docs/TASK.md` | Checklist de progresso — o que está feito e o que está pendente |
| `AJUSTES.md` | Histórico de todos os ajustes de integração front↔API |

---

## Estado atual (2026-07-01)

- API: todos os módulos implementados e funcionando em Docker
- Frontend: integração com API nova concluída (auth, categorias, planos, gerentes)
- Pendentes documentados em `api/docs/TASK.md`:
  - Migration formal (atualmente usa `db push`)
  - Testes manuais dos endpoints `.http`
  - Teste de `docker-compose up` fresh build
- Bugs conhecidos: nenhum crítico aberto — ver `AJUSTES.md` para histórico de correções

---

## Regras invioláveis do domínio

- `movimentacao_conta` é **ledger imutável** — apenas INSERT, nunca UPDATE/DELETE
- `comissao_gerente` idem — apenas INSERT via job assíncrono
- `conta.saldo` é desnormalizado — atualizado junto com a movimentação via `prisma.$transaction`; nunca recalcular via SUM em produção
- `associado.gerenteId` é **permanente** — nunca atualizar após o cadastro
- Toda operação financeira deve ser **atômica** via `prisma.$transaction`
- Saldo nunca pode ficar abaixo de `-limiteCredito` do associado — validado na aplicação (`api/src/shared/utils/limites.ts`) em toda operação de débito (permuta, negociada, transferência, quitação de cobrança RT); não há mais `CHECK` de banco para isso.
