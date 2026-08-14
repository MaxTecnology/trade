# Compra e Venda por Agência e Matriz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agência e Matriz conseguem comprar (permuta/negociada) e vender (Oferta) RT com as mesmas garantias de saldo/limite que Associado já tem, sem quebrar nenhum fluxo existente.

**Architecture:** `Oferta` ganha um `contaId` genérico (novo, aditivo — `associadoId` vira opcional, dado histórico preservado) pra suportar dono Agência/Matriz. `Transacao.compradorId`/`vendedorId` **não mudam** — já são opcionais e só fazem sentido quando a parte é um Associado (usado por avaliação, voucher, comissão de gerente); a fonte de verdade genérica pra saldo/limite já são `contaOrigemId`/`contaDestinoId`, que já são 100% baseados em `Conta` e não precisam de migration. Matriz ganha uma `Conta` real (sem `associadoId`/`agenciaId`), criada uma vez no seed, com `limiteCredito` alto o suficiente pra nunca bloquear na prática. `permuta()`/`negociada()`/`offer.service.ts` passam a resolver saldo/limite/comissão por `Conta.entityType` em vez de assumir Associado.

**Tech Stack:** Fastify + TypeScript, Prisma + PostgreSQL, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-13-compra-venda-agencia-matriz-design.md`

## Global Constraints

- `Transacao.compradorId`/`vendedorId` continuam apontando só pra `Associado` (sem migration) — ficam `null` quando a parte é Agência/Matriz. Isso é uma refinamento sobre a spec original (que sugeria trocar o alvo da FK): `contaOrigemId`/`contaDestinoId` já cobrem 100% do que seria necessário, sem risco de migração em dado histórico de transação.
- `Oferta.contaId` é a nova fonte de verdade de dono da oferta (qualquer `entityType`). `Oferta.associadoId` vira opcional — só preenchido quando o dono é de fato um Associado (denormalizado, mesmo padrão já usado em `Cobranca.associadoId`/`agenciaId`).
- Sem comissão de gerente pra compra de Agência/Matriz (gerente só existe em `Associado`). Comissão da plataforma usa `percentualComissao` do `Plano` da Agência (`Agencia.planoId`, já existe) quando comprador é Agência; `0` quando é Matriz.
- Matriz: sem `statusLoja`, sem checagem de status, sem `limiteVendaMensal`/`Total` (nunca bloqueia por volume). `limiteCredito` alto o bastante pra nunca bloquear por saldo, não uma exceção especial na constraint do banco.
- Agência: sem conceito de loja — só `Agencia.status === 'ativo'` bloqueia.
- Escopo desta rodada é só backend/API — nenhuma tela nova de front. Agência/Matriz vendendo via `negociada()` (negociação direta, sem oferta) fica de fora — só `permuta()` (compra de oferta) e `negociada()` do lado comprador são generalizados; `negociada()` como vendedor continua exigindo um Associado (`vendedorId`), documentado como pendência.

---

## Arquivos que serão criados ou modificados

- **Modificar** `api/prisma/schema.prisma` — `Oferta` ganha `contaId`; `associadoId` vira opcional; `Conta` ganha relação `ofertas Oferta[]`.
- **Criar** migration `api/prisma/migrations/<timestamp>_oferta_conta_generica/migration.sql`.
- **Modificar** `api/prisma/seed.ts` — cria a `Conta` da Matriz (idempotente).
- **Modificar** `api/src/modules/auth/auth.service.ts` — resolve `contaId` da Matriz no login (hoje só resolve pra associado/agência).
- **Modificar** `api/src/modules/offer/offer.service.ts` — `create`/`update`/`setStatus`/`minhaLoja` generalizados por `entityType`.
- **Modificar** `api/src/modules/offer/offer.controller.ts` — usa `request.user.contaId` em vez de `request.user.entityId`.
- **Modificar** `api/src/modules/offer/offer.routes.ts` — guards ganham `agency_admin`/`agency_operator`/`superadmin`.
- **Modificar** `api/src/modules/transaction/transaction.service.ts` — `permuta()`/`negociada()` (lado comprador) generalizados por `entityType`.
- **Modificar** `api/src/modules/transaction/transaction.controller.ts` — usa `request.user.contaId`.
- **Modificar** `api/src/modules/transaction/transaction.routes.ts` — guards ganham `agency_admin`/`agency_operator`/`superadmin` em `/transacoes/permuta` e `/transacoes/negociada`.
- **Modificar** `api/src/modules/queues/bullmq.ts` — workers `commission.calculate` e `commission.gerente` resolvem Associado/Agência a partir da `Conta`, não mais direto de `transacao.comprador`.
- **Modificar** `api/docs/SPEC.md`, `api/docs/SCHEMA.md`, `CLAUDE.md`, `AJUSTES.md`, `docs/tech-debt.md`.

---

### Task 1: Conta real da Matriz + resolução no login

**Files:**
- Modify: `api/prisma/seed.ts`
- Modify: `api/src/modules/auth/auth.service.ts:45-59`

**Interfaces:**
- Produces: uma `Conta` com `entityType: 'matriz'`, `associadoId: null`, `agenciaId: null`, existe garantidamente após o seed rodar.
- Produces: `request.user.contaId` populado no JWT pra usuário Matriz (`entityType === 'matriz'`), igual já acontece pra associado/agência.

- [ ] **Step 1: Adicionar criação idempotente da Conta da Matriz no seed**

Em `api/prisma/seed.ts`, dentro de `main()`, logo depois do bloco que cria/upserta o usuário `Administrador Matriz` (`prisma.usuario.upsert`, procure por `role: 'superadmin'`), adicionar:

```typescript
  // Conta real da Matriz — não tem associadoId/agenciaId (não é 1:1 com nenhuma
  // entidade). limiteCredito alto o bastante pra nunca bloquear na prática (não é
  // uma exceção na constraint do banco, é só um valor que nunca é atingido).
  const contaMatrizExistente = await prisma.conta.findFirst({ where: { entityType: 'matriz' } })
  if (!contaMatrizExistente) {
    await prisma.conta.create({
      data: {
        numero: '0000000',
        entityType: 'matriz',
        limiteCredito: 999999999999,
      },
    })
  }
```

- [ ] **Step 2: Testar o seed localmente**

Suba um Postgres isolado (mesmo padrão usado nas rodadas anteriores desta sessão — `docker run --name seed-matriz-test -e POSTGRES_USER=redetrade -e POSTGRES_PASSWORD=redetrade -e POSTGRES_DB=redetrade -p 15460:5432 -d postgres:16-alpine`), rode `DATABASE_URL="postgresql://redetrade:redetrade@localhost:15460/redetrade" npx prisma migrate deploy` e depois `SEED_ADMIN_PASSWORD="Test@123456" DATABASE_URL="postgresql://redetrade:redetrade@localhost:15460/redetrade" npx tsx prisma/seed.ts`. Confirme com `docker exec seed-matriz-test psql -U redetrade -d redetrade -c "SELECT numero, \"entityType\", \"limiteCredito\" FROM conta WHERE \"entityType\" = 'matriz';"` que existe exatamente 1 linha. Rode o seed uma segunda vez e confirme que continua sendo exatamente 1 linha (idempotência).

- [ ] **Step 3: Resolver `contaId` da Matriz no login**

Em `api/src/modules/auth/auth.service.ts`, o trecho atual (linhas 52-59):

```typescript
  let contaId: string | undefined
  if (usuario.entityType === 'associado' && usuario.associadoId) {
    const conta = await prisma.conta.findUnique({ where: { associadoId: usuario.associadoId } })
    contaId = conta?.id
  } else if (usuario.entityType === 'agencia' && usuario.agenciaId) {
    const conta = await prisma.conta.findUnique({ where: { agenciaId: usuario.agenciaId } })
    contaId = conta?.id
  }
```

Vira:

```typescript
  let contaId: string | undefined
  if (usuario.entityType === 'associado' && usuario.associadoId) {
    const conta = await prisma.conta.findUnique({ where: { associadoId: usuario.associadoId } })
    contaId = conta?.id
  } else if (usuario.entityType === 'agencia' && usuario.agenciaId) {
    const conta = await prisma.conta.findUnique({ where: { agenciaId: usuario.agenciaId } })
    contaId = conta?.id
  } else if (usuario.entityType === 'matriz') {
    const conta = await prisma.conta.findFirst({ where: { entityType: 'matriz' } })
    contaId = conta?.id
  }
```

- [ ] **Step 4: Validar via curl contra o Postgres do Step 2**

Suba a API local apontando pro `seed-matriz-test` (mesmo padrão de `DATABASE_URL`/`REDIS_URL`/`JWT_SECRET` já usado nesta sessão — precisa de um Redis isolado também, `docker run --name seed-matriz-redis -p 16460:6379 -d redis:7-alpine`). Faça login com `admin@redetrade.com.br` / a senha usada no `SEED_ADMIN_PASSWORD` do Step 2, e confirme no corpo da resposta de `POST /auth/login` (decodifique o JWT em https://jwt.io ou via `node -e "console.log(JSON.parse(Buffer.from(process.argv[1].split('.')[1], 'base64')))" "$TOKEN"`) que o payload tem um `contaId` preenchido (UUID, não `undefined`).

- [ ] **Step 5: Commit**

```bash
cd /home/max/job/trade
git add api/prisma/seed.ts api/src/modules/auth/auth.service.ts
git commit -m "feat(api): Matriz ganha Conta real, contaId resolvido no login"
```

Ao final, derrube os containers de teste (`docker rm -f seed-matriz-test seed-matriz-redis`).

---

### Task 2: `Oferta` ganha `contaId` genérico

**Files:**
- Modify: `api/prisma/schema.prisma` (model `Oferta`, ~linhas 429-455; model `Conta`, ~linhas 276-298)
- Create: `api/prisma/migrations/<timestamp>_oferta_conta_generica/migration.sql`

**Interfaces:**
- Produces: `Oferta.contaId` (String, obrigatório após backfill) — dono real da oferta, qualquer `entityType`.
- Produces: `Oferta.associadoId` (String?, agora opcional) — preenchido só quando o dono é um Associado.
- Produces: `Conta.ofertas Oferta[]` — nova relação inversa.

- [ ] **Step 1: Editar o schema**

Em `api/prisma/schema.prisma`, no model `Oferta`, o campo `associadoId` (hoje `String` obrigatório) vira `associadoId String?`, e adicione `contaId String` logo abaixo. As relações (hoje):

```prisma
  categoria  Categoria   @relation(fields: [categoriaId], references: [id])
  associado  Associado   @relation(fields: [associadoId], references: [id])
  transacoes Transacao[]
```

Viram:

```prisma
  categoria  Categoria   @relation(fields: [categoriaId], references: [id])
  associado  Associado?  @relation(fields: [associadoId], references: [id])
  conta      Conta       @relation(fields: [contaId], references: [id])
  transacoes Transacao[]
```

E o índice `@@index([associadoId])` ganha um companheiro `@@index([contaId])` (mantenha o de `associadoId`, não remova).

No model `Conta`, adicione `ofertas Oferta[]` junto das outras relações inversas (perto de `cobranças Cobranca[]`).

- [ ] **Step 2: Gerar a migration com Postgres real**

Suba um Postgres isolado com dado de teste real (reaproveite o `seed-matriz-test` do Task 1 se ainda estiver de pé, ou suba um novo). Insira uma oferta de teste antes de migrar, pra validar que o backfill preserva o dono:

```bash
docker exec seed-matriz-test psql -U redetrade -d redetrade -c "
INSERT INTO oferta (id, titulo, descricao, \"valorRT\", \"quantidadeDisponivel\", \"quantidadeTotal\", \"categoriaId\", \"associadoId\", cidade, estado, \"criadoEm\", \"atualizadoEm\")
SELECT gen_random_uuid(), 'Oferta Teste Migration', 'desc', 100, 1, 1, c.id, a.id, 'São Paulo', 'SP', now(), now()
FROM categoria c, associado a LIMIT 1;
"
```
(se não houver `categoria`/`associado` no banco de teste, cadastre um de cada via API antes — mesmo fluxo usado nas validações anteriores desta sessão.)

Rode `DATABASE_URL="postgresql://redetrade:redetrade@localhost:15460/redetrade" npx prisma migrate dev --name oferta_conta_generica --create-only` (dentro de `api/`). Se o comando falhar por causa do ambiente não-interativo (já aconteceu antes nesta sessão), crie a pasta/arquivo manualmente: `mkdir -p api/prisma/migrations/<timestamp>_oferta_conta_generica` (timestamp no formato `YYYYMMDDHHMMSS`, maior que o da última migration existente).

- [ ] **Step 2: Escrever o SQL da migration**

Conteúdo de `migration.sql`:

```sql
-- Oferta passa a ter dono genérico (Associado, Agência ou Matriz) via contaId.
-- associadoId vira opcional — continua preenchido quando o dono é um Associado
-- (denormalizado, mesmo padrão já usado em Cobranca.associadoId/agenciaId).

ALTER TABLE "oferta" ADD COLUMN "contaId" TEXT;

-- Backfill: toda oferta existente pertence a um Associado — preenche contaId a
-- partir da Conta 1:1 desse Associado.
UPDATE "oferta" o
SET "contaId" = c.id
FROM "conta" c
WHERE c."associadoId" = o."associadoId";

ALTER TABLE "oferta" ALTER COLUMN "contaId" SET NOT NULL;
ALTER TABLE "oferta" ALTER COLUMN "associadoId" DROP NOT NULL;

ALTER TABLE "oferta" ADD CONSTRAINT "oferta_contaId_fkey"
  FOREIGN KEY ("contaId") REFERENCES "conta"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX "oferta_contaId_idx" ON "oferta"("contaId");
```

- [ ] **Step 3: Aplicar e validar**

```bash
DATABASE_URL="postgresql://redetrade:redetrade@localhost:15460/redetrade" npx prisma migrate deploy
```

Confirme que a oferta de teste inserida no Step 2 ficou com `contaId` preenchido corretamente:

```bash
docker exec seed-matriz-test psql -U redetrade -d redetrade -c "
SELECT o.titulo, o.\"associadoId\", o.\"contaId\", c.\"associadoId\" AS conta_dono
FROM oferta o JOIN conta c ON c.id = o.\"contaId\"
WHERE o.titulo = 'Oferta Teste Migration';
"
```
Espera-se que `o."associadoId"` e `conta_dono` sejam o mesmo valor.

- [ ] **Step 4: Regenerar o Prisma Client e rodar typecheck**

```bash
cd api && npx prisma generate && npx tsc --noEmit
```
Espera-se erros de tipo em `offer.service.ts` (linhas que leem `oferta.associado` assumindo obrigatório) — são esperados, corrigidos na Task 3. Confirme que os erros são só nesse arquivo.

- [ ] **Step 5: Commit**

```bash
cd /home/max/job/trade
git add api/prisma/schema.prisma api/prisma/migrations/
git commit -m "feat(api): Oferta ganha contaId genérico (Associado/Agência/Matriz)"
```

---

### Task 3: `offer.service.ts` generalizado por `entityType`

**Files:**
- Modify: `api/src/modules/offer/offer.service.ts` (arquivo inteiro, 111 linhas)

**Interfaces:**
- Consumes: `Oferta.contaId`/`associadoId` (Task 2), `Conta.entityType`/`limiteCredito`.
- Produces: `create(input: CreateOfferInput, contaId: string)` — assinatura muda de `associadoId` pra `contaId`.
- Produces: `update(id, input, contaId: string)`, `setStatus(id, status, contaId: string)`, `minhaLoja(contaId: string, page, limit)` — mesma troca de parâmetro.

- [ ] **Step 1: Reescrever `create()`**

Atual (linhas 5-30):

```typescript
export async function create(input: CreateOfferInput, associadoId: string) {
  const associado = await prisma.associado.findUnique({ where: { id: associadoId } })
  if (!associado) throw Errors.notFound('Associado')
  if (associado.statusLoja !== 'aberta') throw Errors.lojaFechada()
  if (associado.status !== 'ativo') throw Errors.associateSuspended()

  const categoria = await prisma.categoria.findUnique({ where: { id: input.categoriaId } })
  if (!categoria || !categoria.ativo) throw Errors.notFound('Categoria')

  return prisma.oferta.create({
    data: {
      titulo: input.titulo,
      descricao: input.descricao,
      categoriaId: input.categoriaId,
      valorRT: input.valorRT,
      quantidadeDisponivel: input.quantidadeDisponivel,
      quantidadeTotal: input.quantidadeDisponivel,
      tipoAtendimento: input.tipoAtendimento,
      cidade: input.cidade,
      estado: input.estado,
      imagemUrl: input.imagemUrl,
      vencimento: input.vencimento ? new Date(input.vencimento) : undefined,
      associadoId,
    },
  })
}
```

Vira:

```typescript
export async function create(input: CreateOfferInput, contaId: string) {
  const conta = await prisma.conta.findUnique({
    where: { id: contaId },
    include: { associado: true, agencia: true },
  })
  if (!conta) throw Errors.notFound('Conta')

  if (conta.entityType === 'associado') {
    if (!conta.associado) throw Errors.notFound('Associado')
    if (conta.associado.statusLoja !== 'aberta') throw Errors.lojaFechada()
    if (conta.associado.status !== 'ativo') throw Errors.associateSuspended()
  } else if (conta.entityType === 'agencia') {
    if (!conta.agencia) throw Errors.notFound('Agência')
    if (conta.agencia.status !== 'ativo') throw Errors.agencySuspended()
  }
  // Matriz: sem loja, sem status pra checar.

  const categoria = await prisma.categoria.findUnique({ where: { id: input.categoriaId } })
  if (!categoria || !categoria.ativo) throw Errors.notFound('Categoria')

  return prisma.oferta.create({
    data: {
      titulo: input.titulo,
      descricao: input.descricao,
      categoriaId: input.categoriaId,
      valorRT: input.valorRT,
      quantidadeDisponivel: input.quantidadeDisponivel,
      quantidadeTotal: input.quantidadeDisponivel,
      tipoAtendimento: input.tipoAtendimento,
      cidade: input.cidade,
      estado: input.estado,
      imagemUrl: input.imagemUrl,
      vencimento: input.vencimento ? new Date(input.vencimento) : undefined,
      contaId,
      associadoId: conta.entityType === 'associado' ? conta.associadoId : null,
    },
  })
}
```

- [ ] **Step 2: Ajustar `list()` — filtro de loja aberta só pra Associado**

Atual (linhas 32-64), o `where` da listagem pública:

```typescript
  const where = {
    status: 'aberta' as const,
    associado: { statusLoja: 'aberta' as const, status: 'ativo' as const },
    ...
```

Esse filtro em `associado: {...}` já não bloqueia oferta de Agência/Matriz (Prisma trata relação opcional sem match como "não filtra por isso"), mas também não aplica a checagem equivalente de Agência (status ativo). Vira:

```typescript
  const where = {
    status: 'aberta' as const,
    OR: [
      { conta: { entityType: 'matriz' as const } },
      { conta: { entityType: 'agencia' as const, agencia: { status: 'ativo' as const } } },
      { conta: { entityType: 'associado' as const, associado: { statusLoja: 'aberta' as const, status: 'ativo' as const } } },
    ],
    ...
```

(mantenha os demais filtros condicionais — `categoria`, `cidade`, `estado`, `valorRT`, `tipoAtendimento` — exatamente como estão, só o `where.associado` de cima é substituído pelo `where.OR` acima. Ajuste o `include` de `list()` e `getById()` pra trocar `associado: { select: {...} }` por `conta: { include: { associado: { select: { nome: true } }, agencia: { select: { nome: true } } } }` — o consumidor front vai precisar ler `oferta.conta.associado?.nome ?? oferta.conta.agencia?.nome ?? 'Matriz'` pra exibir o nome do vendedor, mas isso é ajuste de front, fora do escopo desta rodada; deixe o include pronto pro front consumir depois.)

- [ ] **Step 3: Ajustar `update()` e `setStatus()` — dono é dono da `Conta`, não do Associado**

Atual (`update`, linhas 75-83):

```typescript
export async function update(id: string, input: UpdateOfferInput, associadoId: string) {
  const oferta = await prisma.oferta.findUnique({ where: { id } })
  if (!oferta) throw Errors.notFound('Oferta')
  if (oferta.associadoId !== associadoId) throw Errors.forbidden()
  return prisma.oferta.update({
    where: { id },
    data: { ...input, vencimento: input.vencimento ? new Date(input.vencimento) : undefined },
  })
}
```

Vira:

```typescript
export async function update(id: string, input: UpdateOfferInput, contaId: string) {
  const oferta = await prisma.oferta.findUnique({ where: { id } })
  if (!oferta) throw Errors.notFound('Oferta')
  if (oferta.contaId !== contaId) throw Errors.forbidden()
  return prisma.oferta.update({
    where: { id },
    data: { ...input, vencimento: input.vencimento ? new Date(input.vencimento) : undefined },
  })
}
```

Mesmo padrão (troca `associadoId` por `contaId`, compara com `oferta.contaId`) em `setStatus()` (linhas 85-94) e `minhaLoja()` (linhas 96-110 — o `where = { associadoId }` vira `where = { contaId }`).

- [ ] **Step 4: Rodar typecheck**

```bash
cd api && npx tsc --noEmit
```
Espera-se limpo agora (os erros da Task 2 Step 4 devem ter sumido).

- [ ] **Step 5: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/offer/offer.service.ts
git commit -m "feat(api): offer.service.ts generalizado por entityType da conta"
```

---

### Task 4: `permuta()` generalizado por `entityType` da conta compradora

**Files:**
- Modify: `api/src/modules/transaction/transaction.service.ts:14-132`

**Interfaces:**
- Consumes: `Oferta.conta` (Task 2/3).
- Produces: `permuta(input: PermutaInput, compradorContaId: string, usuarioId: string)` — assinatura muda de `compradorAssociadoId` pra `compradorContaId`.

- [ ] **Step 1: Reescrever a função inteira**

Trecho atual (linhas 14-49, até a criação do `comissaoBRL`):

```typescript
export async function permuta(input: PermutaInput, compradorAssociadoId: string, usuarioId: string) {
  const oferta = await prisma.oferta.findUnique({
    where: { id: input.ofertaId },
    include: { associado: { include: { plano: true, conta: true } } },
  })
  if (!oferta || oferta.status !== 'aberta' || oferta.quantidadeDisponivel <= 0) {
    throw Errors.offerUnavailable()
  }

  const compradorAssociado = await prisma.associado.findUnique({
    where: { id: compradorAssociadoId },
    include: { plano: true, conta: true },
  })
  if (!compradorAssociado?.conta) throw Errors.notFound('Conta do comprador')
  if (compradorAssociado.status !== 'ativo') throw Errors.associateSuspended()

  const valorTotal = Number(oferta.valorRT) * input.quantidade
  const limiteCredito = Number(compradorAssociado.conta.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorAssociado.conta.saldo), valorTotal, limiteCredito)) {
    throw Errors.insufficientBalance()
  }

  await validarLimiteVenda({
    contaId: compradorAssociado.conta.id,
    valorNovaOperacao: valorTotal,
    limiteVendaMensal: Number(compradorAssociado.limiteVendaMensal ?? 0),
    limiteVendaTotal: Number(compradorAssociado.limiteVendaTotal ?? 0),
  })

const vendedorConta = oferta.associado.conta
  if (!vendedorConta) throw Errors.notFound('Conta do vendedor')

  const valorParcela = valorTotal / input.parcelas
  const compradorContaSaldo = Number(compradorAssociado.conta.saldo)
  const vendedorContaSaldo = Number(vendedorConta.saldo)
  const comissaoBRL = valorTotal * (Number(compradorAssociado.plano.percentualComissao) / 100)
```

Vira:

```typescript
export async function permuta(input: PermutaInput, compradorContaId: string, usuarioId: string) {
  const oferta = await prisma.oferta.findUnique({
    where: { id: input.ofertaId },
    include: { conta: true },
  })
  if (!oferta || oferta.status !== 'aberta' || oferta.quantidadeDisponivel <= 0) {
    throw Errors.offerUnavailable()
  }

  const compradorConta = await prisma.conta.findUnique({
    where: { id: compradorContaId },
    include: {
      associado: { include: { plano: true } },
      agencia: { include: { plano: true } },
    },
  })
  if (!compradorConta) throw Errors.notFound('Conta do comprador')

  let percentualComissao = 0
  let limiteVendaMensal = 0
  let limiteVendaTotal = 0
  if (compradorConta.entityType === 'associado') {
    if (!compradorConta.associado) throw Errors.notFound('Associado')
    if (compradorConta.associado.status !== 'ativo') throw Errors.associateSuspended()
    percentualComissao = Number(compradorConta.associado.plano.percentualComissao)
    limiteVendaMensal = Number(compradorConta.associado.limiteVendaMensal ?? 0)
    limiteVendaTotal = Number(compradorConta.associado.limiteVendaTotal ?? 0)
  } else if (compradorConta.entityType === 'agencia') {
    if (!compradorConta.agencia) throw Errors.notFound('Agência')
    if (compradorConta.agencia.status !== 'ativo') throw Errors.agencySuspended()
    percentualComissao = Number(compradorConta.agencia.plano?.percentualComissao ?? 0)
    limiteVendaMensal = Number(compradorConta.agencia.limiteVendaMensal ?? 0)
    limiteVendaTotal = Number(compradorConta.agencia.limiteVendaTotal ?? 0)
  }
  // Matriz: sem status pra checar, sem comissão, sem teto de volume (fica de fora
  // da checagem de validarLimiteVenda abaixo).

  const valorTotal = Number(oferta.valorRT) * input.quantidade
  const limiteCredito = Number(compradorConta.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorConta.saldo), valorTotal, limiteCredito)) {
    throw Errors.insufficientBalance()
  }

  if (compradorConta.entityType !== 'matriz') {
    await validarLimiteVenda({
      contaId: compradorConta.id,
      valorNovaOperacao: valorTotal,
      limiteVendaMensal,
      limiteVendaTotal,
    })
  }

  const vendedorConta = oferta.conta
  if (!vendedorConta) throw Errors.notFound('Conta do vendedor')

  const valorParcela = valorTotal / input.parcelas
  const compradorContaSaldo = Number(compradorConta.saldo)
  const vendedorContaSaldo = Number(vendedorConta.saldo)
  const comissaoBRL = valorTotal * (percentualComissao / 100)
```

- [ ] **Step 2: Ajustar o corpo da `$transaction` — usar os novos nomes de variável**

No restante da função (a partir de `const transacao = await prisma.$transaction(async (tx) => {`), toda referência a `compradorAssociado.conta!.id` vira `compradorConta.id`, e `compradorId: compradorAssociadoId` vira `compradorId: compradorConta.associado?.id ?? null` (só preenche o campo legado quando o comprador de fato é um Associado — `vendedorId: oferta.associadoId` já funciona sem mudança, porque `Oferta.associadoId` já é opcional desde a Task 2 e resolve `null` sozinho quando o vendedor não é Associado). O resto do corpo (criação de `MovimentacaoConta` por parcela, updates de saldo, decremento de `oferta.quantidadeDisponivel`, criação de `Voucher`, jobs assíncronos) fica **exatamente igual**, só trocando `compradorAssociado.conta!.id` por `compradorConta.id` em todas as ocorrências.

- [ ] **Step 3: Rodar typecheck**

```bash
cd api && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/transaction/transaction.service.ts
git commit -m "feat(api): permuta() generalizada por entityType da conta compradora"
```

---

### Task 5: `negociada()` generalizada (lado comprador)

**Files:**
- Modify: `api/src/modules/transaction/transaction.service.ts:136-248`

**Interfaces:**
- Produces: `negociada(input: NegociadaInput, compradorContaId: string, usuarioId: string)` — mesma troca de parâmetro que `permuta()`. Vendedor continua sendo resolvido como Associado (`input.vendedorId`) — fora de escopo generalizar o lado vendedor nesta rodada (ver Global Constraints).

- [ ] **Step 1: Reescrever a função — mesmo padrão da Task 4, aplicado ao lado comprador**

Trecho atual (linhas 136-172):

```typescript
export async function negociada(input: NegociadaInput, compradorAssociadoId: string, usuarioId: string) {
  if (input.vendedorId === compradorAssociadoId) {
    throw new AppError('VALIDATION_ERROR', 'Não é possível negociar consigo mesmo.', 422)
  }

  const compradorAssociado = await prisma.associado.findUnique({
    where: { id: compradorAssociadoId },
    include: { plano: true, conta: true },
  })
  if (!compradorAssociado?.conta) throw Errors.notFound('Conta do comprador')
  if (compradorAssociado.status !== 'ativo') throw Errors.associateSuspended()

  const vendedorAssociado = await prisma.associado.findUnique({
    where: { id: input.vendedorId },
    include: { conta: true },
  })
  if (!vendedorAssociado?.conta) throw Errors.notFound('Associado vendedor')
  if (vendedorAssociado.status !== 'ativo') throw Errors.associateSuspended()

  const valorTotal = input.valorRT
  const limiteCreditoComprador = Number(compradorAssociado.conta.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorAssociado.conta.saldo), valorTotal, limiteCreditoComprador)) {
    throw Errors.insufficientBalance()
  }

  await validarLimiteVenda({
    contaId: compradorAssociado.conta.id,
    valorNovaOperacao: valorTotal,
    limiteVendaMensal: Number(compradorAssociado.limiteVendaMensal ?? 0),
    limiteVendaTotal: Number(compradorAssociado.limiteVendaTotal ?? 0),
  })

  const vendedorConta = vendedorAssociado.conta
  const valorParcela = valorTotal / input.parcelas
  const compradorContaSaldo = Number(compradorAssociado.conta.saldo)
  const vendedorContaSaldo = Number(vendedorConta.saldo)
  const comissaoBRL = valorTotal * (Number(compradorAssociado.plano.percentualComissao) / 100)
```

Vira (nota: `input.vendedorId` continua sendo um id de `Associado` — só o lado **comprador** generaliza):

```typescript
export async function negociada(input: NegociadaInput, compradorContaId: string, usuarioId: string) {
  const compradorConta = await prisma.conta.findUnique({
    where: { id: compradorContaId },
    include: {
      associado: { include: { plano: true } },
      agencia: { include: { plano: true } },
    },
  })
  if (!compradorConta) throw Errors.notFound('Conta do comprador')

  if (compradorConta.entityType === 'associado' && input.vendedorId === compradorConta.associadoId) {
    throw new AppError('VALIDATION_ERROR', 'Não é possível negociar consigo mesmo.', 422)
  }

  let percentualComissao = 0
  let limiteVendaMensal = 0
  let limiteVendaTotal = 0
  if (compradorConta.entityType === 'associado') {
    if (!compradorConta.associado) throw Errors.notFound('Associado')
    if (compradorConta.associado.status !== 'ativo') throw Errors.associateSuspended()
    percentualComissao = Number(compradorConta.associado.plano.percentualComissao)
    limiteVendaMensal = Number(compradorConta.associado.limiteVendaMensal ?? 0)
    limiteVendaTotal = Number(compradorConta.associado.limiteVendaTotal ?? 0)
  } else if (compradorConta.entityType === 'agencia') {
    if (!compradorConta.agencia) throw Errors.notFound('Agência')
    if (compradorConta.agencia.status !== 'ativo') throw Errors.agencySuspended()
    percentualComissao = Number(compradorConta.agencia.plano?.percentualComissao ?? 0)
    limiteVendaMensal = Number(compradorConta.agencia.limiteVendaMensal ?? 0)
    limiteVendaTotal = Number(compradorConta.agencia.limiteVendaTotal ?? 0)
  }

  const vendedorAssociado = await prisma.associado.findUnique({
    where: { id: input.vendedorId },
    include: { conta: true },
  })
  if (!vendedorAssociado?.conta) throw Errors.notFound('Associado vendedor')
  if (vendedorAssociado.status !== 'ativo') throw Errors.associateSuspended()

  const valorTotal = input.valorRT
  const limiteCreditoComprador = Number(compradorConta.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorConta.saldo), valorTotal, limiteCreditoComprador)) {
    throw Errors.insufficientBalance()
  }

  if (compradorConta.entityType !== 'matriz') {
    await validarLimiteVenda({
      contaId: compradorConta.id,
      valorNovaOperacao: valorTotal,
      limiteVendaMensal,
      limiteVendaTotal,
    })
  }

  const vendedorConta = vendedorAssociado.conta
  const valorParcela = valorTotal / input.parcelas
  const compradorContaSaldo = Number(compradorConta.saldo)
  const vendedorContaSaldo = Number(vendedorConta.saldo)
  const comissaoBRL = valorTotal * (percentualComissao / 100)
```

- [ ] **Step 2: Ajustar o corpo da `$transaction`**

Mesma troca da Task 4: `compradorAssociado.conta!.id` → `compradorConta.id`, `compradorId: compradorAssociadoId` → `compradorId: compradorConta.associado?.id ?? null`. `vendedorId: input.vendedorId` fica igual (já é sempre um Associado nesta rodada).

- [ ] **Step 3: Rodar typecheck**

```bash
cd api && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/transaction/transaction.service.ts
git commit -m "feat(api): negociada() generalizada por entityType da conta compradora"
```

---

### Task 6: Controllers usam `request.user.contaId`

**Files:**
- Modify: `api/src/modules/offer/offer.controller.ts:14-58`
- Modify: `api/src/modules/transaction/transaction.controller.ts:16-26`

**Interfaces:**
- Consumes: `permuta`/`negociada` com assinatura `(input, compradorContaId, usuarioId)` (Tasks 4/5); `offerService.create/update/setStatus/minhaLoja` com assinatura `(..., contaId)` (Task 3).

- [ ] **Step 1: `offer.controller.ts` — trocar `entityId` por `contaId`**

Todas as 4 ocorrências de `request.user.entityId` neste arquivo (`createController` linha 16, `updateController` linha 40, `setStatusController` linha 49, `minhaLojaController` linha 56) trocam pra `request.user.contaId`, com a checagem de ausência que já existe em `transferenciaController` (`transaction.controller.ts:36`). Exemplo pro `createController` (linhas 14-19):

```typescript
export async function createController(request: FastifyRequest, reply: FastifyReply) {
  const input = createOfferSchema.parse(request.body)
  if (!request.user.contaId) throw Errors.forbidden()
  const oferta = await offerService.create(input, request.user.contaId)
  return reply.status(201).send(success(oferta))
}
```

Aplique o mesmo padrão (`if (!request.user.contaId) throw Errors.forbidden()` antes de usar) nos outros 3 controllers do arquivo. `Errors` já está importado no topo do arquivo (linha 10).

- [ ] **Step 2: `transaction.controller.ts` — `permutaController`/`negociadaController`**

Atual (linhas 16-26):

```typescript
export async function permutaController(request: FastifyRequest, reply: FastifyReply) {
  const input = permutaSchema.parse(request.body)
  const t = await txService.permuta(input, request.user.entityId, request.user.id)
  return reply.status(201).send(success(t))
}

export async function negociadaController(request: FastifyRequest, reply: FastifyReply) {
  const input = negociadaSchema.parse(request.body)
  const t = await txService.negociada(input, request.user.entityId, request.user.id)
  return reply.status(201).send(success(t))
}
```

Vira:

```typescript
export async function permutaController(request: FastifyRequest, reply: FastifyReply) {
  const input = permutaSchema.parse(request.body)
  if (!request.user.contaId) throw Errors.forbidden()
  const t = await txService.permuta(input, request.user.contaId, request.user.id)
  return reply.status(201).send(success(t))
}

export async function negociadaController(request: FastifyRequest, reply: FastifyReply) {
  const input = negociadaSchema.parse(request.body)
  if (!request.user.contaId) throw Errors.forbidden()
  const t = await txService.negociada(input, request.user.contaId, request.user.id)
  return reply.status(201).send(success(t))
}
```

(`Errors` já importado no topo do arquivo, linha 12.)

- [ ] **Step 3: Rodar typecheck**

```bash
cd api && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/offer/offer.controller.ts api/src/modules/transaction/transaction.controller.ts
git commit -m "feat(api): controllers de oferta/transação usam contaId do JWT"
```

---

### Task 7: Guards de rota — Agência e Matriz ganham acesso

**Files:**
- Modify: `api/src/modules/offer/offer.routes.ts`
- Modify: `api/src/modules/transaction/transaction.routes.ts:15-19`

**Interfaces:** nenhuma (só configuração de rota).

- [ ] **Step 1: `offer.routes.ts`**

Atual:

```typescript
export async function offerRoutes(app: FastifyInstance) {
  const operatorGuard = {
    preHandler: [authGuard, roleGuard('associate_admin', 'associate_operator')],
  }

  app.post('/ofertas', operatorGuard, createController)
  app.get('/ofertas', listController) // público
  app.get('/ofertas/minha-loja', operatorGuard, minhaLojaController)
  app.get('/ofertas/:id', getByIdController) // público
  app.put('/ofertas/:id', operatorGuard, updateController)
  app.patch('/ofertas/:id/status', operatorGuard, setStatusController)
}
```

Vira:

```typescript
export async function offerRoutes(app: FastifyInstance) {
  const operatorGuard = {
    preHandler: [
      authGuard,
      roleGuard('associate_admin', 'associate_operator', 'agency_admin', 'agency_operator', 'superadmin'),
    ],
  }

  app.post('/ofertas', operatorGuard, createController)
  app.get('/ofertas', listController) // público
  app.get('/ofertas/minha-loja', operatorGuard, minhaLojaController)
  app.get('/ofertas/:id', getByIdController) // público
  app.put('/ofertas/:id', operatorGuard, updateController)
  app.patch('/ofertas/:id/status', operatorGuard, setStatusController)
}
```

- [ ] **Step 2: `transaction.routes.ts`**

Atual (linha 16):

```typescript
  const operator = { preHandler: [authGuard, roleGuard('associate_operator', 'associate_admin')] }
```

Essa constante `operator` também guarda `/transacoes/:id/avaliar` e as rotas `GET /transacoes*` (linhas 24, 28-29) — **não mude essas três**, avaliação e listagem continuam só pra Associado (fora de escopo). Em vez disso, crie uma constante nova só pra permuta/negociada:

```typescript
export async function transactionRoutes(app: FastifyInstance) {
  const operator = { preHandler: [authGuard, roleGuard('associate_operator', 'associate_admin')] }
  const comprador = {
    preHandler: [
      authGuard,
      roleGuard('associate_operator', 'associate_admin', 'agency_operator', 'agency_admin', 'superadmin'),
    ],
  }
  const assocAdmin = { preHandler: [authGuard, roleGuard('associate_admin')] }
  const superadmin = { preHandler: [authGuard, roleGuard('superadmin')] }
  const adminOrSuper = { preHandler: [authGuard, roleGuard('superadmin', 'agency_admin')] }
  const auth = { preHandler: [authGuard] }

  app.post('/transacoes/permuta', comprador, permutaController)
  app.post('/transacoes/negociada', comprador, negociadaController)
  app.patch('/transacoes/:id/avaliar', operator, avaliarController)
  app.post('/transacoes/transferencia', assocAdmin, transferenciaController)
  app.post('/transacoes/credito', superadmin, creditoController)
  app.post('/transacoes/:id/estorno', adminOrSuper, estornoController)
  app.get('/transacoes', operator, listController)
  app.get('/transacoes/:id', operator, getByIdController)
}
```

- [ ] **Step 3: Rodar typecheck**

```bash
cd api && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/offer/offer.routes.ts api/src/modules/transaction/transaction.routes.ts
git commit -m "feat(api): agency_admin/operator e superadmin ganham acesso a ofertas e compra"
```

---

### Task 8: Workers de comissão resolvem a partir da `Conta`

**Files:**
- Modify: `api/src/modules/queues/bullmq.ts:75-139`

**Interfaces:**
- Consumes: `Transacao.contaOrigemId` (já existe, sempre preenchido em permuta/negociada).

- [ ] **Step 1: Worker `commission.calculate` — resolver `associadoId`/`agenciaId`/`diaVencimentoFatura` a partir da Conta**

Atual (linhas 75-106):

```typescript
  new Worker(
    'commission.calculate',
    async (job) => {
      const { transacaoId } = job.data as { transacaoId: string }
      const transacao = await prisma.transacao.findUnique({
        where: { id: transacaoId },
        include: { comprador: true },
      })
      if (!transacao || !transacao.comissaoBRL || Number(transacao.comissaoBRL) <= 0) return
      if (!transacao.comprador || !transacao.contaOrigemId) return

      // A comissão calculada (comissaoBRL) só ficava guardada na própria transação, sem
      // nenhum jeito de efetivamente ser cobrada de alguém. Vira uma Cobrança BRL no
      // comprador, vinculada à transação, seguindo o mesmo padrão de cobrança de inscrição.
      const jaExiste = await prisma.cobranca.findFirst({ where: { transacaoId } })
      if (jaExiste) return

      const vencimento = calcularVencimento(transacao.comprador.diaVencimentoFatura ?? 10)
      await prisma.cobranca.create({
        data: {
          descricao: `Comissão da plataforma — transação #${transacaoId.slice(0, 8)}`,
          valorBRL: transacao.comissaoBRL,
          vencimento,
          contaId: transacao.contaOrigemId,
          associadoId: transacao.compradorId,
          agenciaId: transacao.comprador.agenciaId,
          transacaoId,
        },
      })
    },
    conn(),
  )
```

Vira (não depende mais de `transacao.comprador`, que só resolve quando o comprador é Associado — passa a buscar a `Conta` de origem, que sempre existe):

```typescript
  new Worker(
    'commission.calculate',
    async (job) => {
      const { transacaoId } = job.data as { transacaoId: string }
      const transacao = await prisma.transacao.findUnique({ where: { id: transacaoId } })
      if (!transacao || !transacao.comissaoBRL || Number(transacao.comissaoBRL) <= 0) return
      if (!transacao.contaOrigemId) return

      const contaOrigem = await prisma.conta.findUnique({
        where: { id: transacao.contaOrigemId },
        include: { associado: true, agencia: true },
      })
      if (!contaOrigem) return

      // A comissão calculada (comissaoBRL) só ficava guardada na própria transação, sem
      // nenhum jeito de efetivamente ser cobrada de alguém. Vira uma Cobrança BRL no
      // comprador, vinculada à transação, seguindo o mesmo padrão de cobrança de inscrição.
      const jaExiste = await prisma.cobranca.findFirst({ where: { transacaoId } })
      if (jaExiste) return

      const diaVencimentoFatura =
        contaOrigem.associado?.diaVencimentoFatura ?? contaOrigem.agencia?.diaVencimentoFatura ?? 10
      const vencimento = calcularVencimento(diaVencimentoFatura)
      await prisma.cobranca.create({
        data: {
          descricao: `Comissão da plataforma — transação #${transacaoId.slice(0, 8)}`,
          valorBRL: transacao.comissaoBRL,
          vencimento,
          contaId: transacao.contaOrigemId,
          associadoId: contaOrigem.associadoId,
          agenciaId: contaOrigem.agenciaId,
          transacaoId,
        },
      })
    },
    conn(),
  )
```

- [ ] **Step 2: Worker `commission.gerente` — saída explícita quando comprador não é Associado**

Atual (linhas 108-139):

```typescript
  new Worker(
    'commission.gerente',
    async (job) => {
      const { transacaoId } = job.data as { transacaoId: string }
      const transacao = await prisma.transacao.findUnique({
        where: { id: transacaoId },
        include: { comprador: { include: { gerente: true } } },
      })
      if (!transacao?.comprador?.gerenteId || !transacao.comprador.gerente) return

      const gerente = transacao.comprador.gerente
      if (!gerente.percentualComissao) return

      // Opção A: comissão é X% do valor RT da transação
      const comissaoRT =
        Number(transacao.valorRT) * (Number(gerente.percentualComissao) / 100)

      await prisma.comissaoGerente.create({
        data: {
          gerenteId: gerente.id,
          associadoId: transacao.compradorId!,
          transacaoId,
          tipoComissao: 'transacao',
          baseValorRT: transacao.valorRT,
          percentual: gerente.percentualComissao,
          comissaoBRL: 0,
          comissaoRT,
        },
      })
    },
    conn(),
  )
```

Vira (comissão de gerente só existe quando o comprador é de fato um Associado com `gerenteId` — a saída vira explícita e comentada em vez de depender implicitamente de uma relação Prisma resolvendo `null`):

```typescript
  new Worker(
    'commission.gerente',
    async (job) => {
      const { transacaoId } = job.data as { transacaoId: string }
      const transacao = await prisma.transacao.findUnique({ where: { id: transacaoId } })
      if (!transacao?.contaOrigemId) return

      const contaOrigem = await prisma.conta.findUnique({
        where: { id: transacao.contaOrigemId },
        include: { associado: { include: { gerente: true } } },
      })

      // Comissão de gerente só existe quando quem comprou é um Associado cadastrado
      // por um gerente — Agência e Matriz nunca geram essa comissão.
      if (contaOrigem?.entityType !== 'associado') return
      if (!contaOrigem.associado?.gerenteId || !contaOrigem.associado.gerente) return

      const gerente = contaOrigem.associado.gerente
      if (!gerente.percentualComissao) return

      // Opção A: comissão é X% do valor RT da transação
      const comissaoRT =
        Number(transacao.valorRT) * (Number(gerente.percentualComissao) / 100)

      await prisma.comissaoGerente.create({
        data: {
          gerenteId: gerente.id,
          associadoId: contaOrigem.associado.id,
          transacaoId,
          tipoComissao: 'transacao',
          baseValorRT: transacao.valorRT,
          percentual: gerente.percentualComissao,
          comissaoBRL: 0,
          comissaoRT,
        },
      })
    },
    conn(),
  )
```

- [ ] **Step 3: Rodar typecheck**

```bash
cd api && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/queues/bullmq.ts
git commit -m "feat(api): workers de comissão resolvem Associado/Agência a partir da Conta"
```

---

### Task 9: Validação end-to-end + Documentação

**Files:**
- Modify: `api/docs/SPEC.md` (§8 Ofertas, §9/§13 Transações)
- Modify: `api/docs/SCHEMA.md` (models `Oferta`, `Conta`)
- Modify: `CLAUDE.md` (raiz — hierarquia)
- Modify: `AJUSTES.md` (nova entrada)
- Modify: `docs/tech-debt.md` (registrar o que ficou de fora: negociada() como vendedor pra Agência/Matriz, front sem tela nova)

**Interfaces:** nenhuma — task de validação e documentação.

- [ ] **Step 1: Validação end-to-end via curl contra API + Postgres reais**

Suba Postgres+Redis isolados (mesmo padrão usado a sessão inteira), rode migrations + seed, suba a API. Fluxo de validação:

1. Login como Matriz (`admin@redetrade.com.br`) — confirme `contaId` no JWT (repete a checagem da Task 1, agora com o schema final).
2. Cadastre uma Agência com plano vinculado (`planoId`) e `percentualComissao` conhecido, faça login como `agency_admin` dela — confirme `contaId` no JWT.
3. Como Matriz, `POST /ofertas` — confirme `201` e que a oferta criada tem `contaId` = conta da Matriz, `associadoId: null`.
4. Cadastre um Associado (com saldo positivo via `POST /transacoes/credito` como Matriz, ou via injeção de crédito já existente no fluxo). Faça login como esse Associado.
5. Como Associado, `POST /transacoes/permuta` comprando da oferta da Matriz do passo 3 — confirme `201`, e confirme via query direta no banco que `movimentacao_conta` tem um débito no Associado e um crédito na conta da Matriz, e que `comissaoBRL` da transação é `0` (Matriz não vendeu com comissão — comissão é sobre o COMPRADOR, então nesse caso específico confirme que o `percentualComissao` usado foi o do plano do Associado comprador, normal).
6. Repita o fluxo com a Agência como COMPRADORA (login como `agency_admin`, `POST /transacoes/permuta` numa oferta de um Associado) — confirme que `comissaoBRL` da transação usa o `percentualComissao` do plano da Agência, e que nenhum `comissao_gerente` foi criado (Agência não gera comissão de gerente).
7. Confirme que `GET /ofertas` (público) lista a oferta da Matriz do passo 3 normalmente.

- [ ] **Step 2: Atualizar `api/docs/SPEC.md`**

§8 (Ofertas) — trocar a regra de negócio "Associado deve estar com loja aberta pra criar oferta" por: "Associado precisa de loja aberta; Agência precisa estar `ativo`; Matriz sem restrição. `POST/PUT/PATCH /ofertas*` aceitam `associate_admin`, `associate_operator`, `agency_admin`, `agency_operator`, `superadmin` — cada um opera em nome da própria conta (Associado, Agência ou Matriz)." Atualizar a tabela de campos do model `Oferta` — `associadoId` agora opcional, `contaId` novo campo obrigatório.

§9/§13 (Transações — confirme o número real da seção no índice do arquivo) — nota similar em `POST /transacoes/permuta` e `/negociada`: "aceitam também `agency_admin`/`agency_operator`/`superadmin` — comprador pode ser Associado, Agência ou Matriz. Comissão da plataforma usa o plano de quem compra (Associado ou Agência); Matriz não gera comissão. Comissão de gerente só existe quando o comprador é Associado com gerente vinculado. `negociada()` como **vendedor** continua exigindo um Associado (`vendedorId`) — Agência/Matriz vendendo por negociação direta (sem oferta) não é suportado nesta rodada."

- [ ] **Step 3: Atualizar `api/docs/SCHEMA.md`**

Sincronizar os blocos Prisma de `Oferta` e `Conta` com o schema real (campo `contaId` novo, `associadoId` opcional, relação `Conta.ofertas`).

- [ ] **Step 4: Atualizar `CLAUDE.md` (raiz)**

Na seção de hierarquia/contexto do projeto, adicionar uma linha: "Matriz e Agência também compram e vendem RT (permuta/oferta), não só emitem/gerenciam — ver `AJUSTES.md` (2026-08-13)."

- [ ] **Step 5: Nova entrada em `AJUSTES.md`**

Seguir o padrão histórico do arquivo (motivação → o que mudou → validado). Cobrir: por que (pedido do usuário, Matriz/Agência precisavam comprar/vender com segurança), o que mudou (Conta real da Matriz, `Oferta.contaId`, `permuta`/`negociada` generalizados, guards, workers de comissão), o que ficou de fora (negociada como vendedor, telas de front).

- [ ] **Step 6: Atualizar `docs/tech-debt.md`**

Adicionar entrada: "`negociada()` só generaliza o lado comprador — Agência/Matriz não conseguem vender por negociação direta (sem oferta), só via `Oferta`. Ação futura: se o negócio precisar, `negociadaSchema.vendedorId` precisa aceitar um `contaId` genérico, com ajuste correspondente no front (hoje o `diretório de associados` só lista Associados)." E outra: "Sem tela de front pra Agência/Matriz cadastrar oferta ou comprar — API pronta, front é rodada separada."

- [ ] **Step 7: Commit**

```bash
cd /home/max/job/trade
git add api/docs/SPEC.md api/docs/SCHEMA.md CLAUDE.md AJUSTES.md docs/tech-debt.md
git commit -m "docs: compra e venda por Agência e Matriz"
```
