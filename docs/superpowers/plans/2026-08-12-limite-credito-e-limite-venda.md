# Limite de Crédito e Limite de Venda (substitui plano.limiteRT) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ativar os campos `Associado.limiteCredito`, `limiteVendaMensal` e `limiteVendaTotal` (já capturados no cadastro, hoje nunca lidos) como regras de negócio de verdade, substituindo o uso atual de `plano.limiteRT` nas validações de transação.

**Architecture:** `limiteCredito` vira o teto de quanto `conta.saldo` pode ficar negativo (validado na aplicação — `CHECK` de banco não alcança porque o campo está em `associado`, não em `conta`). `limiteVendaMensal`/`limiteVendaTotal` viram o teto de volume transacionado (mês corrente / histórico total), substituindo `plano.limiteRT`. `plano.limiteRT` deixa de ser lido nas validações — some código, permanece só como referência no schema (não é removido do banco nesta rodada).

**Tech Stack:** Fastify + TypeScript, Prisma + PostgreSQL, Vitest.

## Global Constraints

- `limiteCredito`, `limiteVendaMensal`, `limiteVendaTotal` são `Decimal?` (nullable) no schema — `null` e `0` têm o **mesmo efeito**: zero de permissão (nenhum saldo negativo permitido / nenhum volume permitido). Não existe "ilimitado" nesta implementação — mesmo comportamento que `plano.limiteRT` já tinha (campo obrigatório, sem opção de ilimitado).
- Toda comparação de saldo/limite usa `Number(...)` sobre os `Decimal` do Prisma, seguindo o padrão já usado em `transaction.service.ts`.
- Não mexer no fluxo de `estorno` (`transaction.service.ts:370-455`) — é reversão de crédito já dado, não "compra", fica com a checagem atual (`contaDestino.saldo < original.valorRT`, sem margem de crédito).
- Não mexer em `credito()` (injeção de RT pela Matriz) nem no branch BRL de `quitarCobranca` — não debitam saldo RT.

---

## Arquivos que serão criados ou modificados

- **Criar** `api/src/shared/utils/limites.ts` — funções puras/DB de validação de saldo e volume, únicas no projeto (hoje a lógica de limite mensal está duplicada em `permuta()` e `negociada()`).
- **Criar** `api/src/shared/utils/limites.test.ts` — testes das funções puras.
- **Modificar** `api/src/modules/transaction/transaction.service.ts` — `permuta()`, `negociada()`, `transferencia()`.
- **Modificar** `api/src/modules/cobranca/cobranca.service.ts` — `quitarCobranca()`.
- **Modificar** `api/src/modules/auth/auth.service.ts` — corrige `conta.limiteCredito` (hoje retorna `plano.limiteRT` por engano).
- **Criar** migration `api/prisma/migrations/<timestamp>_remove_saldo_nao_negativo_constraint/migration.sql`.
- **Modificar** `api/docs/SCHEMA.md`, `api/docs/SPEC.md`, `api/docs/ARCHITECTURE.md`, `AJUSTES.md`.

---

### Task 1: Helper de validação de saldo/limite (`limites.ts`)

**Files:**
- Create: `api/src/shared/utils/limites.ts`
- Test: `api/src/shared/utils/limites.test.ts`

**Interfaces:**
- Produces: `saldoSuficienteParaDebito(saldoAtual: number, valorDebito: number, limiteCredito: number): boolean` — função pura.
- Produces: `getLimiteCreditoDaConta(contaId: string): Promise<number>` — busca `Associado.limiteCredito` ou `Agencia.limiteCredito` via `Conta`, retorna `0` se não encontrado/null.
- Produces: `validarLimiteVenda(params: { contaId: string; valorNovaOperacao: number; limiteVendaMensal: number; limiteVendaTotal: number }): Promise<void>` — lança `Errors.planLimitReached()` se estourar mensal ou total.

- [ ] **Step 1: Escrever o teste da função pura `saldoSuficienteParaDebito`**

```typescript
// api/src/shared/utils/limites.test.ts
import { describe, expect, it } from 'vitest'
import { saldoSuficienteParaDebito } from './limites.js'

describe('saldoSuficienteParaDebito', () => {
  it('permite débito que deixa o saldo exatamente no limite de crédito', () => {
    // saldo -500, limite 1000, débito de 500 -> saldo final -1000 (exatamente no teto)
    expect(saldoSuficienteParaDebito(-500, 500, 1000)).toBe(true)
  })

  it('bloqueia débito que passaria do limite de crédito', () => {
    // saldo -500, limite 1000, débito de 501 -> saldo final -1001 (passou do teto)
    expect(saldoSuficienteParaDebito(-500, 501, 1000)).toBe(false)
  })

  it('permite débito normal com saldo positivo e limite zero', () => {
    expect(saldoSuficienteParaDebito(1000, 500, 0)).toBe(true)
  })

  it('bloqueia débito que ficaria negativo quando limite de crédito é zero', () => {
    expect(saldoSuficienteParaDebito(100, 200, 0)).toBe(false)
  })

  it('trata limite de crédito null como zero (nenhuma margem)', () => {
    expect(saldoSuficienteParaDebito(0, 1, 0)).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha (módulo não existe ainda)**

Run: `cd api && npx vitest run src/shared/utils/limites.test.ts`
Expected: FAIL — `Cannot find module './limites.js'`

- [ ] **Step 3: Implementar `limites.ts`**

```typescript
// api/src/shared/utils/limites.ts
import { prisma } from '../../config/prisma.js'
import { Errors } from '../errors/AppError.js'

export function saldoSuficienteParaDebito(
  saldoAtual: number,
  valorDebito: number,
  limiteCredito: number,
): boolean {
  return saldoAtual - valorDebito >= -limiteCredito
}

export async function getLimiteCreditoDaConta(contaId: string): Promise<number> {
  const conta = await prisma.conta.findUnique({
    where: { id: contaId },
    select: {
      associado: { select: { limiteCredito: true } },
      agencia: { select: { limiteCredito: true } },
    },
  })
  const limite = conta?.associado?.limiteCredito ?? conta?.agencia?.limiteCredito ?? 0
  return Number(limite)
}

export async function validarLimiteVenda(params: {
  contaId: string
  valorNovaOperacao: number
  limiteVendaMensal: number
  limiteVendaTotal: number
}): Promise<void> {
  const { contaId, valorNovaOperacao, limiteVendaMensal, limiteVendaTotal } = params

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [mesAgg, totalAgg] = await Promise.all([
    prisma.movimentacaoConta.aggregate({
      where: { contaId, tipo: 'debito', criadoEm: { gte: inicioMes } },
      _sum: { valor: true },
    }),
    prisma.movimentacaoConta.aggregate({
      where: { contaId, tipo: 'debito' },
      _sum: { valor: true },
    }),
  ])

  const totalMes = Number(mesAgg._sum.valor ?? 0)
  const totalGeral = Number(totalAgg._sum.valor ?? 0)

  if (totalMes + valorNovaOperacao > limiteVendaMensal) throw Errors.planLimitReached()
  if (totalGeral + valorNovaOperacao > limiteVendaTotal) throw Errors.planLimitReached()
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `cd api && npx vitest run src/shared/utils/limites.test.ts`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
cd /home/max/job/trade
git add api/src/shared/utils/limites.ts api/src/shared/utils/limites.test.ts
git commit -m "feat(api): helper de validação de limite de crédito e limite de venda"
```

---

### Task 2: `permuta()` usa `limiteCredito`/`limiteVendaMensal`/`limiteVendaTotal` do Associado

**Files:**
- Modify: `api/src/modules/transaction/transaction.service.ts:13-46`

**Interfaces:**
- Consumes: `saldoSuficienteParaDebito` e `validarLimiteVenda` de `../../shared/utils/limites.js` (Task 1).

- [ ] **Step 1: Substituir a checagem de saldo e de limite mensal**

Em `api/src/modules/transaction/transaction.service.ts`, o trecho atual (linhas 22-46):

```typescript
  const compradorAssociado = await prisma.associado.findUnique({
    where: { id: compradorAssociadoId },
    include: { plano: true, conta: true },
  })
  if (!compradorAssociado?.conta) throw Errors.notFound('Conta do comprador')
  if (compradorAssociado.status !== 'ativo') throw Errors.associateSuspended()

  const valorTotal = Number(oferta.valorRT) * input.quantidade
  if (Number(compradorAssociado.conta.saldo) < valorTotal) throw Errors.insufficientBalance()

  // Verificar limite mensal do plano
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const movimentacoesMes = await prisma.movimentacaoConta.aggregate({
    where: {
      contaId: compradorAssociado.conta.id,
      tipo: 'debito',
      criadoEm: { gte: inicioMes },
    },
    _sum: { valor: true },
  })
  const totalMes = Number(movimentacoesMes._sum.valor ?? 0)
  const limiteRT = Number(compradorAssociado.plano.limiteRT)
  if (totalMes + valorTotal > limiteRT) throw Errors.planLimitReached()
```

Vira:

```typescript
  const compradorAssociado = await prisma.associado.findUnique({
    where: { id: compradorAssociadoId },
    include: { plano: true, conta: true },
  })
  if (!compradorAssociado?.conta) throw Errors.notFound('Conta do comprador')
  if (compradorAssociado.status !== 'ativo') throw Errors.associateSuspended()

  const valorTotal = Number(oferta.valorRT) * input.quantidade
  const limiteCredito = Number(compradorAssociado.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorAssociado.conta.saldo), valorTotal, limiteCredito)) {
    throw Errors.insufficientBalance()
  }

  await validarLimiteVenda({
    contaId: compradorAssociado.conta.id,
    valorNovaOperacao: valorTotal,
    limiteVendaMensal: Number(compradorAssociado.limiteVendaMensal ?? 0),
    limiteVendaTotal: Number(compradorAssociado.limiteVendaTotal ?? 0),
  })
```

- [ ] **Step 2: Adicionar o import no topo do arquivo**

```typescript
import { getLimiteCreditoDaConta, saldoSuficienteParaDebito, validarLimiteVenda } from '../../shared/utils/limites.js'
```

(o import de `getLimiteCreditoDaConta` é usado nas Tasks 4 e 5 — pode incluir aqui já, sem uso ainda gera erro de lint de import não usado; se preferir, adicione só `saldoSuficienteParaDebito` e `validarLimiteVenda` nesta task e o resto na Task 4).

- [ ] **Step 3: Rodar typecheck**

Run: `cd api && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/transaction/transaction.service.ts
git commit -m "feat(api): permuta usa limiteCredito/limiteVenda do associado em vez de plano.limiteRT"
```

---

### Task 3: `negociada()` usa a mesma lógica

**Files:**
- Modify: `api/src/modules/transaction/transaction.service.ts:141-176`

- [ ] **Step 1: Substituir o trecho equivalente em `negociada()`**

O trecho atual (linhas 160-176):

```typescript
  const valorTotal = input.valorRT
  if (Number(compradorAssociado.conta.saldo) < valorTotal) throw Errors.insufficientBalance()

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const movimentacoesMes = await prisma.movimentacaoConta.aggregate({
    where: {
      contaId: compradorAssociado.conta.id,
      tipo: 'debito',
      criadoEm: { gte: inicioMes },
    },
    _sum: { valor: true },
  })
  const totalMes = Number(movimentacoesMes._sum.valor ?? 0)
  const limiteRT = Number(compradorAssociado.plano.limiteRT)
  if (totalMes + valorTotal > limiteRT) throw Errors.planLimitReached()
```

Vira:

```typescript
  const valorTotal = input.valorRT
  const limiteCreditoComprador = Number(compradorAssociado.limiteCredito ?? 0)
  if (!saldoSuficienteParaDebito(Number(compradorAssociado.conta.saldo), valorTotal, limiteCreditoComprador)) {
    throw Errors.insufficientBalance()
  }

  await validarLimiteVenda({
    contaId: compradorAssociado.conta.id,
    valorNovaOperacao: valorTotal,
    limiteVendaMensal: Number(compradorAssociado.limiteVendaMensal ?? 0),
    limiteVendaTotal: Number(compradorAssociado.limiteVendaTotal ?? 0),
  })
```

- [ ] **Step 2: Rodar typecheck**

Run: `cd api && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/transaction/transaction.service.ts
git commit -m "feat(api): negociada usa limiteCredito/limiteVenda do associado em vez de plano.limiteRT"
```

---

### Task 4: `transferencia()` respeita `limiteCredito` da conta de origem

**Files:**
- Modify: `api/src/modules/transaction/transaction.service.ts:285-291`

**Interfaces:**
- Consumes: `getLimiteCreditoDaConta`, `saldoSuficienteParaDebito` (Task 1).

- [ ] **Step 1: Substituir a checagem de saldo**

Atual (linha 286-288):

```typescript
  const contaOrigem = await prisma.conta.findUnique({ where: { id: contaOrigemId } })
  if (!contaOrigem || !contaOrigem.ativo) throw Errors.notFound('Conta de origem')
  if (Number(contaOrigem.saldo) < input.valorRT) throw Errors.insufficientBalance()
```

Vira:

```typescript
  const contaOrigem = await prisma.conta.findUnique({ where: { id: contaOrigemId } })
  if (!contaOrigem || !contaOrigem.ativo) throw Errors.notFound('Conta de origem')
  const limiteCreditoOrigem = await getLimiteCreditoDaConta(contaOrigemId)
  if (!saldoSuficienteParaDebito(Number(contaOrigem.saldo), input.valorRT, limiteCreditoOrigem)) {
    throw Errors.insufficientBalance()
  }
```

- [ ] **Step 2: Rodar typecheck**

Run: `cd api && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/transaction/transaction.service.ts
git commit -m "feat(api): transferencia respeita limiteCredito da conta de origem"
```

---

### Task 5: `quitarCobranca()` (RT) respeita `limiteCredito` do devedor

**Files:**
- Modify: `api/src/modules/cobranca/cobranca.service.ts:93-96`

**Interfaces:**
- Consumes: `getLimiteCreditoDaConta`, `saldoSuficienteParaDebito` de `../../shared/utils/limites.js`.

- [ ] **Step 1: Adicionar o import no topo de `cobranca.service.ts`**

```typescript
import { getLimiteCreditoDaConta, saldoSuficienteParaDebito } from '../../shared/utils/limites.js'
```

- [ ] **Step 2: Substituir a checagem de saldo**

Atual (linhas 93-96):

```typescript
  if (cobranca.valorRT) {
    const contaDevedora = await prisma.conta.findUniqueOrThrow({ where: { id: cobranca.contaId } })
    const valor = Number(cobranca.valorRT)
    if (Number(contaDevedora.saldo) < valor) throw Errors.insufficientBalance()
```

Vira:

```typescript
  if (cobranca.valorRT) {
    const contaDevedora = await prisma.conta.findUniqueOrThrow({ where: { id: cobranca.contaId } })
    const valor = Number(cobranca.valorRT)
    const limiteCredito = await getLimiteCreditoDaConta(contaDevedora.id)
    if (!saldoSuficienteParaDebito(Number(contaDevedora.saldo), valor, limiteCredito)) {
      throw Errors.insufficientBalance()
    }
```

Este é exatamente o caso de uso que motivou a mudança: taxa de inscrição paga parte em RT vira uma `Cobranca` (`associate.service.ts:119-133`), e quitá-la agora pode deixar o associado negativo até o `limiteCredito` dele, em vez de bloquear.

- [ ] **Step 3: Rodar typecheck**

Run: `cd api && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/cobranca/cobranca.service.ts
git commit -m "feat(api): quitação de cobrança RT respeita limiteCredito do devedor"
```

---

### Task 6: Migration — remove o CHECK `saldo_nao_negativo`

**Files:**
- Create: `api/prisma/migrations/<timestamp>_remove_saldo_nao_negativo_constraint/migration.sql`
- Modify: `api/prisma/seed.ts` (remover a criação idempotente dessa constraint)

**Interfaces:**
- Nenhuma — mudança de schema pura.

- [ ] **Step 1: Localizar e remover a criação da constraint no seed**

Em `api/prisma/seed.ts`, remover o bloco (por volta da linha 99-104):

```typescript
        SELECT 1 FROM pg_constraint WHERE conname = 'saldo_nao_negativo'
```
e o `ALTER TABLE conta ADD CONSTRAINT saldo_nao_negativo CHECK (saldo >= 0);` correspondente — ler o arquivo completo antes de editar pra pegar o bloco `DO $$ ... $$` inteiro (guard idempotente), não só a linha do ALTER TABLE.

- [ ] **Step 2: Criar a migration formal**

```bash
cd api
DATABASE_URL="postgresql://redetrade:redetrade@localhost:5433/redetrade" npx prisma migrate dev --name remove_saldo_nao_negativo_constraint --create-only
```

Editar o SQL gerado pra conter exatamente:

```sql
ALTER TABLE "conta" DROP CONSTRAINT IF EXISTS "saldo_nao_negativo";
```

- [ ] **Step 3: Aplicar e validar**

Run: `DATABASE_URL="postgresql://redetrade:redetrade@localhost:5433/redetrade" npx prisma migrate deploy`
Expected: migration aplicada sem erro; confirmar com `\d conta` no psql que a constraint sumiu.

- [ ] **Step 4: Commit**

```bash
cd /home/max/job/trade
git add api/prisma/migrations/ api/prisma/seed.ts
git commit -m "feat(api): remove CHECK saldo_nao_negativo — validação vira responsabilidade da aplicação (limiteCredito por associado)"
```

---

### Task 7: Corrige `conta.limiteCredito` em `/auth/me`

**Files:**
- Modify: `api/src/modules/auth/auth.service.ts:143-161`

- [ ] **Step 1: Trocar a fonte do campo**

Atual (linhas 143-161):

```typescript
  if (usuario.entityType === 'associado' && usuario.associadoId) {
    const associado = await prisma.associado.findUnique({
      where: { id: usuario.associadoId },
      select: {
        nome: true,
        plano: { select: { limiteRT: true } },
        conta: { select: { id: true, numero: true, saldo: true } },
      },
    })
    if (associado) {
      entityName = associado.nome
      if (associado.conta) {
        conta = {
          id: associado.conta.id,
          numero: associado.conta.numero,
          saldo: Number(associado.conta.saldo),
          limiteCredito: Number(associado.plano?.limiteRT ?? 0),
        }
      }
    }
  }
```

Vira:

```typescript
  if (usuario.entityType === 'associado' && usuario.associadoId) {
    const associado = await prisma.associado.findUnique({
      where: { id: usuario.associadoId },
      select: {
        nome: true,
        limiteCredito: true,
        conta: { select: { id: true, numero: true, saldo: true } },
      },
    })
    if (associado) {
      entityName = associado.nome
      if (associado.conta) {
        conta = {
          id: associado.conta.id,
          numero: associado.conta.numero,
          saldo: Number(associado.conta.saldo),
          limiteCredito: Number(associado.limiteCredito ?? 0),
        }
      }
    }
  }
```

**Atenção:** isso muda o valor que o front recebe em `conta.limiteCredito` (hoje mostra o limite mensal do plano, ex: 5000; depois da mudança mostra o `limiteCredito` real do associado, tipicamente um número bem menor ou zero pra quem nunca teve esse campo preenchido). Conferir no front (`AuthContext.jsx`/`authFunction.js`, mapeamento documentado no `CLAUDE.md` como `conta.saldoPermuta`/`tipoDaConta.descricao`) se `limiteCredito` é exibido em algum lugar visível ao usuário — se for, o texto ao redor pode precisar de ajuste pra não confundir (ex: se hoje o rótulo é "Limite de Permuta", trocar pra "Limite de Crédito" ou vice-versa dependendo do que for exibido).

- [ ] **Step 2: Rodar typecheck**

Run: `cd api && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd /home/max/job/trade
git add api/src/modules/auth/auth.service.ts
git commit -m "fix(api): conta.limiteCredito em /auth/me retornava plano.limiteRT por engano"
```

---

### Task 8: Atualizar documentação

**Files:**
- Modify: `api/docs/SCHEMA.md`
- Modify: `api/docs/SPEC.md` (§3 Gestão de Associados, §6 Planos, §13 Transações — conferir número real da seção de Transações no índice do arquivo)
- Modify: `api/docs/ARCHITECTURE.md` (regra "saldo nunca negativo")
- Modify: `AJUSTES.md`

- [ ] **Step 1: `SCHEMA.md`** — documentar que `Associado.limiteCredito` é o teto de saldo negativo, `limiteVendaMensal`/`limiteVendaTotal` são os tetos de volume (substituindo `plano.limiteRT` nas validações), e que a constraint `saldo_nao_negativo` foi removida do banco (validação agora é de aplicação).

- [ ] **Step 2: `SPEC.md` §3 (Associados)** — adicionar à seção "Regras de Negócio" (depois da linha 146, antes do `### Payload de Criação`):

```markdown
- `limiteCredito` define o teto de quanto a conta RT do associado pode ficar negativa (`saldo - valorDebito >= -limiteCredito`). `0`/não informado = nenhuma margem negativa.
- `limiteVendaMensal`/`limiteVendaTotal` definem o teto de volume debitado da conta (mês corrente / histórico total). Substituem `plano.limiteRT`, que deixou de ser usado nas validações de transação — permanece só como valor de referência ao cadastrar o associado.
```

- [ ] **Step 3: `ARCHITECTURE.md`** — localizar a seção que documenta "Saldo nunca pode ser negativo" (regra inviolável) e reescrever pra "Saldo nunca pode ficar abaixo de `-limiteCredito` do associado — validado na aplicação em toda operação de débito (permuta, negociada, transferência, quitação de cobrança RT); não há mais `CHECK` de banco para isso."

- [ ] **Step 4: `AJUSTES.md`** — adicionar entrada nova (seguindo o padrão histórico do arquivo) descrevendo a mudança: motivação (taxa de inscrição paga parte em dinheiro/parte em permuta, associado pode ficar negativo até o limite de crédito), o que mudou (`limiteCredito`/`limiteVendaMensal`/`limiteVendaTotal` ativados, `plano.limiteRT` aposentado das validações, constraint de banco removida), e o bug corrigido de `conta.limiteCredito` em `/auth/me`.

- [ ] **Step 5: Commit**

```bash
cd /home/max/job/trade
git add api/docs/SCHEMA.md api/docs/SPEC.md api/docs/ARCHITECTURE.md AJUSTES.md
git commit -m "docs: documenta limiteCredito/limiteVendaMensal/limiteVendaTotal substituindo plano.limiteRT"
```

---

## Fora de escopo desta rodada (decisões já tomadas, não implementar aqui)

- Mudar `Plano.taxaInscricaoRT`/`taxaManutencaoAnualRT` de RT pra R$ — discussão separada, ainda não confirmada (ver memória `project_taxa_inscricao_rt_para_brl`).
- Front: pré-preencher `limiteVendaMensal` com `plano.limiteRT` como sugestão ao cadastrar associado — `Form_Operacoes.jsx` hoje não faz isso, os 3 campos são digitados manualmente do zero. Melhoria futura, não bloqueia esta rodada.
- Remover `Plano.limiteRT` do schema — mantido no banco, só para de ser lido nas validações. Remover a coluna é mudança de schema maior, decisão separada.
