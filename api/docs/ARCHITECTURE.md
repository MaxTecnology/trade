# ARCHITECTURE.md — Rede Trade (Sistema de Permuta)

## 1. Visão Geral

A Rede Trade é uma plataforma de gestão de permutas (trocas) entre empresas, operando com uma moeda interna chamada **RT (Real Trade)**. A plataforma é hierárquica, multitenante e orientada a contas empresariais.

A API é **RESTful**, consumida exclusivamente pelo frontend próprio da plataforma (não pública para terceiros). Toda documentação OpenAPI/Swagger será gerada automaticamente pelo framework.

---

## 2. Hierarquia de Entidades

```
Matriz  (instância única — dono da plataforma)
  └── Agência Master  (franqueado regional de grande porte)
        └── Agência Comum  (franqueado local)
              └── Associado  (empresa que realiza permutas)
                    └── Usuários  (até 4 por associado, operam a conta)
```

### Regras da Hierarquia

- A **Matriz** é a única entidade que pode injetar RT no sistema (equivalente a um banco central).
- **Agências Master** são criadas pela Matriz. Podem criar Agências Comuns e Associados.
- **Agências Comuns** são criadas por Agências Master. Podem criar Associados.
- **Associados** são as empresas que de fato realizam permutas. Possuem uma conta RT.
- **Usuários** pertencem a um Associado. Não possuem saldo próprio — apenas operam a conta do Associado.
- Cada entidade da hierarquia (exceto Usuário) possui sua própria conta RT.

### Papel (Role) dos Usuários

O papel é um atributo do **usuário dentro de uma entidade**, não uma entidade separada:

| Role | Pertence a | Descrição |
|---|---|---|
| `superadmin` | Matriz | Acesso total ao sistema. |
| `agency_admin` | Agência (Master ou Comum) | Administrador da agência. Gerencia tudo dentro da sua entidade. |
| `agency_operator` | Agência (Master ou Comum) | Operador com acesso restrito dentro da agência. |
| `gerente` | Matriz, Agência Master ou Agência Comum | Cadastra Associados e visualiza dados dos Associados que cadastrou. Recebe comissão BRL sobre as movimentações desses Associados. Pode existir múltiplos por entidade. |
| `associate_admin` | Associado | Administrador do Associado. Cadastra usuários e configura a conta. |
| `associate_operator` | Associado | Realiza permutas e consulta extrato. |

### Regras do Role `gerente`

- Um gerente **sempre pertence a uma entidade** (Matriz, Agência Master ou Agência Comum).
- Pode existir **múltiplos gerentes** em qualquer entidade da hierarquia.
- O gerente **cadastra Associados** vinculados à sua entidade.
- A relação gerente → associado é **permanente**: a comissão sempre será creditada ao gerente que cadastrou, mesmo que o gerente mude de status.
- O gerente **visualiza dados e extratos** dos Associados que cadastrou, mas **não pode suspendê-los** (isso é exclusivo do `agency_admin`).
- O gerente **não realiza operações financeiras** — não movimenta RT, não cria ofertas.
- Cada gerente tem um **percentual de comissão individual** configurado no momento do seu cadastro.
- A comissão é calculada **sobre a comissão BRL** que a plataforma já cobra por transação (não sobre o valor RT bruto).
- O registro de comissão é **apenas financeiro/relatório** — não há fluxo de saque automatizado no MVP.

---

## 3. Modelo de Conta RT

- Toda entidade (Agência Master, Agência Comum, Associado) possui **uma única conta RT**.
- Cada conta tem um **número único** no formato `XXXXXXX` (7 dígitos).
- Sub-usuários de um Associado recebem um **identificador de acesso** derivado: `XXXXXXX-01`, `XXXXXXX-02`, até `XXXXXXX-04`. Este identificador é apenas para identificação de operador — **não representa uma conta financeira separada**.
- O saldo da conta **nunca pode ser negativo**.
- Toda movimentação é registrada em uma tabela de ledger imutável (`movimentacao_conta`).

---

## 4. Fluxo de RT no Sistema

```
Matriz injeta RT
     │
     ▼
Agência Master recebe RT
     │
     ▼
Agência Comum recebe RT
     │
     ▼
Associado recebe RT (via plano ou transferência)
     │
     ▼
Associado realiza permuta (RT circula entre Associados)
```

- **RT não sai do sistema** — apenas circula entre contas internas.
- A Matriz é a única fonte geradora de RT.
- Comissões da plataforma são cobradas em **moeda real (BRL)**, não em RT.

---

## 5. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js (LTS mais recente) |
| Framework | Fastify |
| ORM | Prisma |
| Banco de dados | PostgreSQL |
| Autenticação | JWT (access token + refresh token) |
| Hash de senha | bcrypt |
| Validação | Zod |
| Filas assíncronas | BullMQ + Redis |
| Cache | Redis |
| Documentação API | @fastify/swagger + @fastify/swagger-ui |
| Testes | Vitest + Supertest |
| Containerização | Docker + Docker Compose |

---

## 6. Estrutura de Pastas

```
src/
  modules/
    auth/
    matrix/
    agency/
    associate/
    user/
    account/
    offer/
    transaction/
    voucher/
    category/
    plan/
    report/
  shared/
    middleware/
    guards/
    errors/
    utils/
    types/
  config/
  app.ts
  server.ts

prisma/
  schema.prisma
  migrations/
  seed.ts

docs/
  ARCHITECTURE.md
  SPEC.md
  SCHEMA.md
```

Cada módulo contém:
```
modules/[modulo]/
  [modulo].routes.ts
  [modulo].controller.ts
  [modulo].service.ts
  [modulo].schema.ts   (Zod schemas)
  [modulo].types.ts
```

---

## 7. Autenticação e Autorização

### JWT

- **Access Token**: validade de 15 minutos.
- **Refresh Token**: validade de 7 dias, armazenado em httpOnly cookie.
- Endpoint de refresh: `POST /auth/refresh`.
- Endpoint de logout invalida o refresh token.

### Guards de Autorização

Todo endpoint protegido passa por dois guards em sequência:

1. **AuthGuard**: valida o JWT e injeta `req.user` (id, role, entityId, entityType).
2. **RoleGuard**: verifica se o role do usuário tem permissão para aquela rota.

### Hierarquia de Permissões

Permissões são cumulativas de cima para baixo:
- `superadmin` acessa tudo.
- `agency_admin` acessa tudo dentro da sua agência e entidades filhas.
- `gerente` acessa apenas os Associados que ele mesmo cadastrou (leitura + cadastro).
- `associate_admin` acessa tudo dentro do seu associado.
- `associate_operator` acessa operações do dia a dia (permutas, extrato).

---

## 8. Transações e Atomicidade

Toda operação financeira (débito/crédito) deve ser executada dentro de uma **transação Prisma** (`prisma.$transaction`).

Regra absoluta: **ou a operação completa integralmente, ou faz rollback total**. Nunca estado parcial.

Fluxo de uma permuta:
```
1. Validar saldo da conta compradora
2. Validar limites do plano
3. BEGIN TRANSACTION
   a. Criar registro em movimentacao_conta (débito comprador)
   b. Criar registro em movimentacao_conta (crédito vendedor)
   c. Criar registro em transacao
   d. Atualizar saldo em conta (comprador e vendedor)
   e. Decrementar quantidade disponível na oferta
   f. Gerar voucher
4. COMMIT
5. Disparar job assíncrono (notificação, cálculo de comissão em BRL)
```

---

## 9. Filas Assíncronas (BullMQ)

Operações que **não devem bloquear** a resposta da API:

| Fila | Descrição |
|---|---|
| `voucher.generate` | Geração do PDF do voucher após transação |
| `commission.calculate` | Cálculo da comissão BRL da plataforma após transação |
| `commission.gerente` | Cálculo e registro da comissão BRL do gerente após transação |
| `notification.send` | Envio de e-mail/notificação |
| `offer.close` | Fechamento automático de oferta com quantidade zero |

---

## 10. Decisões Técnicas Relevantes

| Decisão | Justificativa |
|---|---|
| Fastify over Express | Performance superior, schema validation nativa, suporte a TypeScript de primeira classe |
| Prisma over SQL direto | Migrations controladas, type safety, legibilidade do schema |
| Ledger imutável (`movimentacao_conta`) | Auditoria completa, impossibilidade de alteração retroativa de saldo |
| Saldo desnormalizado em `conta` | Evita recalcular saldo via SUM a cada consulta — atualizado via transaction junto com o ledger |
| BullMQ para jobs assíncronos | Desacopla operações pesadas da resposta HTTP, garante retry em falhas |
| Redis para cache | Cache de sessão, rate limiting, e filas BullMQ |

---

## 11. Variáveis de Ambiente (.env)

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/redetrade

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Bcrypt
BCRYPT_SALT_ROUNDS=12
```

---

## 12. Padrões de Resposta da API

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 50 }
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Saldo insuficiente para realizar a operação.",
    "details": []
  }
}
```

### Códigos de erro customizados relevantes

| Código | HTTP | Descrição |
|---|---|---|
| `UNAUTHORIZED` | 401 | Token inválido ou expirado |
| `FORBIDDEN` | 403 | Sem permissão para a operação |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `INSUFFICIENT_BALANCE` | 422 | Saldo RT insuficiente |
| `PLAN_LIMIT_REACHED` | 422 | Limite mensal do plano atingido |
| `DUPLICATE_CNPJ` | 409 | CNPJ já cadastrado |
| `MAX_USERS_REACHED` | 422 | Limite de usuários por associado atingido |
| `OFFER_UNAVAILABLE` | 422 | Oferta fechada ou sem quantidade |
| `VALIDATION_ERROR` | 400 | Erro de validação dos campos |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor |
