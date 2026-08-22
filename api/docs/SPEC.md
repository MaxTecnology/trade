# SPEC.md — Especificação Funcional da API

## Índice

1. [Autenticação](#1-autenticação)
2. [Gestão de Agências](#2-gestão-de-agências)
3. [Gestão de Associados](#3-gestão-de-associados)
4. [Gestão de Usuários](#4-gestão-de-usuários)
5. [Gestão de Gerentes](#5-gestão-de-gerentes)
6. [Planos](#6-planos)
7. [Categorias](#7-categorias)
8. [Ofertas de Permuta](#8-ofertas-de-permuta)
9. [Transações RT](#9-transações-rt)
10. [Vouchers](#10-vouchers)
11. [Relatórios e Extratos](#11-relatórios-e-extratos)
12. [Solicitações de Crédito RT](#12-solicitações-de-crédito-rt)
13. [Cobranças / Faturas BRL](#13-cobranças--faturas-brl)
14. [Upload de Arquivos](#14-upload-de-arquivos-backblaze-b2)
17. [Solicitação de Estorno](#17-solicitação-de-estorno)

---

## 1. Autenticação

### Endpoints

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login com e-mail e senha | ❌ |
| POST | `/auth/refresh` | Renovar access token | ❌ (refresh token cookie) |
| POST | `/auth/logout` | Invalidar sessão | ✅ |
| GET | `/auth/me` | Retorna usuário autenticado | ✅ |

### Regras

- Login aceita `email` + `senha`.
- Retorna `accessToken` no body e `refreshToken` em httpOnly cookie.
- Máximo de 5 tentativas de login falhas consecutivas antes de bloquear por 15 minutos.
- O campo `me` retorna: id, nome, email, role, entityType, entityId, contaId (quando aplicável).

### Payload de Login
```json
{
  "email": "usuario@empresa.com",
  "senha": "SenhaForte@123"
}
```

### Resposta de Login
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "usuario": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@empresa.com",
      "role": "associate_admin",
      "entityType": "associado",
      "entityId": "uuid-do-associado"
    }
  }
}
```

---

## 2. Gestão de Agências

### Contexto

Agências existem em dois tipos: `master` e `comum`. Ambas são gerenciadas pelo mesmo conjunto de endpoints, com `tipo` como discriminador.

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| POST | `/agencias` | Criar agência | `superadmin` (master) / `agency_admin` (comum) |
| GET | `/agencias` | Listar agências | `superadmin` |
| GET | `/agencias/me` | Dados completos da própria agência logada (somente leitura, pra "Meus Dados") — entidade resolvida via `request.user.entityId`, não pelo `:id` | `agency_admin`, `agency_operator` |
| GET | `/agencias/:id` | Detalhar agência | `superadmin`, `agency_admin` (própria) |
| PUT | `/agencias/:id` | Atualizar agência | `superadmin`, `agency_admin` (própria) |
| PATCH | `/agencias/:id/status` | Ativar/suspender agência | `superadmin` |
| GET | `/agencias/:id/associados` | Listar associados da agência | `agency_admin`, `gerente` (apenas os próprios) |
| GET | `/agencias/:id/conta` | Ver conta RT da agência | `agency_admin` |
| GET | `/agencias/:id/gerentes` | Listar gerentes da agência | `agency_admin`, `superadmin` |

### Regras de Negócio

- Agências do tipo `master` só podem ser criadas pela Matriz (`superadmin`).
- Agências do tipo `comum` são criadas por uma Agência Master (`agency_admin` de master).
- Toda agência possui uma conta RT criada automaticamente no momento do cadastro.
- CNPJ deve ser único no sistema.
- Agências suspensas não podem criar novos Associados nem realizar operações financeiras.
- Ao criar uma agência, o usuário criador torna-se automaticamente `agency_admin` dela.

### Payload de Criação
```json
{
  "nome": "Agência Central Norte",
  "cnpj": "12.345.678/0001-99",
  "tipo": "master",
  "email": "contato@agencianorte.com",
  "telefone": "82999998888",
  "endereco": {
    "logradouro": "Rua das Flores, 100",
    "cidade": "Maceió",
    "estado": "AL",
    "cep": "57000-000"
  },
  "agenciaParenteId": null
}
```

---

## 3. Gestão de Associados

### Contexto

Associados são as empresas que efetivamente realizam permutas. São vinculados a uma Agência Comum ou Master. Possuem conta RT, plano ativo e até 4 usuários operacionais.

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| POST | `/associados` | Criar associado | `agency_admin` |
| GET | `/associados` | Listar associados | `agency_admin` |
| GET | `/associados/me` | Dados completos do próprio associado logado (somente leitura, pra "Meus Dados") — entidade resolvida via `request.user.entityId`, não pelo `:id` | `associate_admin`, `associate_operator`, `gerente` |
| GET | `/associados/:id` | Detalhar associado | `agency_admin`, `associate_admin` (próprio) |
| PUT | `/associados/:id` | Atualizar associado | `associate_admin` |
| PATCH | `/associados/:id/status` | Ativar/suspender | `agency_admin` |
| GET | `/associados/:id/conta` | Ver conta RT | `associate_admin` |
| PATCH | `/associados/:id/loja` | Abrir/fechar loja | `associate_admin` |

### Regras de Negócio

- Agência e gerente são **opcionais** no cadastro (implementação atual — diverge da versão original desta spec). Quando presente, o vínculo gerente → associado é definido no momento da criação.
- O plano (`planoId`) é **obrigatório** no cadastro.
- Toda criação de associado gera automaticamente uma conta RT.
- O número da conta é gerado sequencialmente com 7 dígitos: `0000001`.
- Associados possuem um atributo `tipoAtendimento`: `presencial`, `online`, `voucher` (múltiplos permitidos).
- A opção `voucher` só aparece se habilitada nas configurações da plataforma.
- Associados podem ter a loja `aberta` ou `fechada` — loja fechada não aparece nas buscas de ofertas.
- Associados suspensos não podem realizar operações.
- CNPJ deve ser único no sistema.
- O vínculo gerente → associado é **permanente** e não pode ser reatribuído.
- `limiteCredito` define o teto de quanto a conta RT do associado pode ficar negativa (`saldo - valorDebito >= -limiteCredito`). `0`/não informado = nenhuma margem negativa.
- `limiteVendaMensal`/`limiteVendaTotal` definem o teto de volume **creditado** na conta por vender (mês corrente / histórico total) — limitam quem vende (recebe RT), não quem compra. Quem compra já é limitado por `saldo`+`limiteCredito`. Substituem `plano.limiteRT`, que deixou de ser usado nas validações de transação — permanece só como valor de referência ao cadastrar o associado.

### Payload de Criação
```json
{
  "nome": "Padaria Central",
  "cnpj": "98.765.432/0001-10",
  "email": "contato@padariacentral.com",
  "telefone": "82988887777",
  "agenciaId": "uuid-da-agencia",
  "gerenteId": "uuid-do-gerente",
  "planoId": "uuid-do-plano",
  "tipoAtendimento": ["presencial", "online"],
  "endereco": {
    "logradouro": "Av. Principal, 500",
    "cidade": "Arapiraca",
    "estado": "AL",
    "cep": "57300-000"
  }
}
```

---

## 4. Gestão de Usuários

### Contexto

Usuários pertencem a uma entidade (Agência ou Associado). Usuários de Associados têm um identificador de operador derivado da conta (`XXXXXXX-01` até `XXXXXXX-04`). **Não possuem saldo próprio**.

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| POST | `/usuarios` | Criar usuário | `associate_admin`, `agency_admin` |
| GET | `/usuarios` | Listar usuários da entidade | `associate_admin`, `agency_admin` |
| GET | `/usuarios/:id` | Detalhar usuário | próprio usuário, admin da entidade |
| PUT | `/usuarios/:id` | Atualizar dados | próprio usuário, admin da entidade |
| PATCH | `/usuarios/:id/senha` | Alterar a própria senha (exige senha atual) | próprio usuário |
| PATCH | `/usuarios/:id/senha/redefinir` | Redefinir senha de outro usuário do mesmo tenant (sem senha atual — cobre "esqueci a senha") | `associate_admin`, `agency_admin` |
| PATCH | `/usuarios/:id/status` | Ativar/desativar usuário | admin da entidade |
| DELETE | `/usuarios/:id` | Remover usuário | `associate_admin`, `agency_admin` |

### Regras de Negócio

- Máximo de **4 usuários por Associado** (excluindo o `associate_admin` principal).
- E-mail deve ser único no sistema.
- O `associate_admin` principal é criado automaticamente junto com o Associado — não conta no limite dos 4.
- `codigoOperador` (`{numeroDaConta}-{sequencial}`) é atribuído sequencialmente pra **todo** usuário novo (admin ou operador, Associado ou Agência) — o admin criado junto com a entidade é sempre `-01`. Não é uma conta nem saldo separado, só identificação de quem fez o quê (`Transacao.usuarioIniciadorId`); não reutilizado dentro da mesma conta. Matriz (`superadmin`) não tem — não é Associado/Agência. Usuários criados antes dessa regra existir foram corrigidos via `scripts/backfill-codigo-operador.ts` (rodar uma vez em cada ambiente que já tinha dado antes dessa mudança).
- Usuários desativados não conseguem fazer login.
- Um usuário não pode pertencer a mais de uma entidade.

### Payload de Criação
```json
{
  "nome": "Maria Oliveira",
  "email": "maria@padariacentral.com",
  "senha": "SenhaForte@456",
  "role": "associate_operator",
  "entityId": "uuid-do-associado",
  "entityType": "associado"
}
```

---

## 5. Gestão de Gerentes

### Contexto

O Gerente é um role de usuário que existe em qualquer nível da hierarquia (Matriz, Agência Master, Agência Comum). Sua função é **cadastrar Associados** e **receber comissão BRL** sobre as movimentações dos Associados que cadastrou. Múltiplos gerentes podem coexistir dentro de uma mesma entidade.

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| POST | `/gerentes` | Cadastrar gerente | `superadmin`, `agency_admin` |
| GET | `/gerentes` | Listar gerentes da entidade | `superadmin`, `agency_admin` |
| GET | `/gerentes/:id` | Detalhar gerente | `superadmin`, `agency_admin`, próprio gerente |
| PUT | `/gerentes/:id` | Atualizar dados do gerente | `superadmin`, `agency_admin` |
| PATCH | `/gerentes/:id/status` | Ativar/desativar gerente | `superadmin`, `agency_admin` |
| GET | `/gerentes/:id/associados` | Listar associados cadastrados pelo gerente | `superadmin`, `agency_admin`, próprio gerente |
| GET | `/gerentes/:id/comissoes` | Extrato de comissões do gerente | `superadmin`, `agency_admin`, próprio gerente |

### Regras de Negócio

- O gerente é criado como um **usuário com role `gerente`** vinculado a uma entidade (Matriz, Agência Master ou Agência Comum).
- Cada gerente possui um **percentual de comissão individual** (`percentualComissao`) definido no cadastro.
- A comissão do gerente é calculada sobre a **comissão BRL da plataforma** gerada pelas transações dos Associados que ele cadastrou.
  - Exemplo: plataforma cobra 5% BRL sobre uma transação → gerente recebe X% desse valor de comissão.
- O registro de comissão é feito na tabela `comissao_gerente` via job assíncrono (`commission.gerente`) após cada transação concluída.
- O gerente **não pode suspender ou alterar dados** dos Associados — apenas visualiza.
- O gerente **não realiza operações financeiras** — não movimenta RT, não cria ofertas.
- O vínculo gerente → associado é **permanente** — mesmo que o gerente seja desativado, o histórico de comissões é preservado.
- Um gerente desativado não pode cadastrar novos Associados, mas suas comissões históricas permanecem registradas.

### Payload de Criação
```json
{
  "nome": "Carlos Mendes",
  "email": "carlos@redetrade.com.br",
  "senha": "SenhaForte@789",
  "percentualComissao": 10.0,
  "entityId": "uuid-da-agencia-ou-matriz",
  "entityType": "agencia"
}
```

### Resposta de Comissões (`GET /gerentes/:id/comissoes`)

> Modelo atual (`ComissaoGerente`): `tipoComissao` (`inscricao | transacao`), `baseValorRT`, `percentual`, `comissaoBRL`, `comissaoRT`. Ver detalhes da regra em `AJUSTES.md` §Gerentes.

```json
{
  "success": true,
  "data": {
    "totalComissaoBRL": 1250.50,
    "totalComissaoRT": 300.00,
    "comissoes": [
      {
        "id": "uuid",
        "transacaoId": "uuid-da-transacao",
        "associadoId": "uuid-do-associado",
        "associadoNome": "Padaria Central",
        "tipoComissao": "transacao",
        "baseValorRT": 200.00,
        "percentual": 10.0,
        "comissaoBRL": 0,
        "comissaoRT": 20.00,
        "criadoEm": "2026-04-15T14:30:00Z"
      }
    ]
  },
  "meta": { "page": 1, "total": 38 }
}
```

---

## 6. Planos

### Contexto

Planos definem as regras financeiras de uma entidade (Associado, Agência ou Gerente): limite de movimentação RT, percentual de comissão e taxas de inscrição/manutenção. Um plano é sempre segregado por `tipoPlano`.

> `periodicidade` e `maxParcelas` foram **removidos** do modelo (ver `AJUSTES.md` §Planos — Campos removidos). O parcelamento continua existindo na `Transacao` (`parcelas`/`totalParcelas`), mas não é mais limitado pelo plano.

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| POST | `/planos` | Criar plano | `superadmin` |
| GET | `/planos` | Listar planos | `superadmin`, `agency_admin`, `agency_operator`, `associate_admin`, `associate_operator`, `gerente` |
| GET | `/planos/:id` | Detalhar plano | `superadmin`, `agency_admin` |
| PUT | `/planos/:id` | Atualizar plano | `superadmin` |
| PATCH | `/planos/:id/status` | Ativar/desativar plano | `superadmin` |

### Regras de Negócio

- Todo plano deve ter: `nome`, `tipoPlano` (`agencia\|associado\|gerente`), `limiteRT`, `percentualComissao`.
- `taxaInscricao` e `taxaManutencaoAnual` são opcionais (default `0`), em **R$** (dinheiro real recebido pela Matriz, não RT) — usados só para planos de tipo `associado`. Sem vínculo automático com a cobrança do associado: `valorInscricaoBRL`/`valorInscricaoRT` no cadastro do associado (§3) são digitados manualmente pelo admin, independentes deste valor de referência do plano.
- Nome é único **por tipo de plano** (`@@unique([nome, tipoPlano])`) — pode haver "Plano Básico" tanto para associado quanto para agência.
- Planos inativos não podem ser atribuídos a novas entidades.
- Alterar um plano não afeta retroativamente entidades já vinculadas — é necessário reatribuir explicitamente.
- `limiteRT` **não é mais usado nas validações de transação** — substituído por `limiteVendaMensal`/`limiteVendaTotal` do próprio `Associado` (ver §3). Permanece obrigatório no cadastro do plano apenas como valor de referência.

### Payload de Criação
```json
{
  "nome": "Plano Básico",
  "tipoPlano": "associado",
  "limiteRT": 5000,
  "percentualComissao": 5.0,
  "taxaInscricao": 100,
  "taxaManutencaoAnual": 50,
  "ativo": true
}
```

---

## 7. Categorias

### Contexto

Categorias são globais e hierárquicas. Classificam as ofertas de permuta. Gerenciadas exclusivamente pelo `superadmin`.

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| POST | `/categorias` | Criar categoria | `superadmin` |
| GET | `/categorias` | Listar categorias (árvore) | público |
| GET | `/categorias/:id` | Detalhar categoria | público |
| PUT | `/categorias/:id` | Atualizar categoria | `superadmin` |
| PATCH | `/categorias/:id/status` | Ativar/desativar | `superadmin` |

### Regras de Negócio

- Categorias podem ter uma categoria pai (`categoriaParenteId`), formando hierarquia de até 3 níveis.
- Não pode haver nomes duplicados no mesmo nível hierárquico.
- Categorias **não podem ser excluídas** se possuírem ofertas vinculadas — apenas desativadas.
- Categorias inativas não aparecem na listagem pública nem podem ser associadas a novas ofertas.
- `GET /categorias` retorna a árvore completa de categorias ativas.

### Payload de Criação
```json
{
  "nome": "Alimentação",
  "categoriaParenteId": null,
  "ativo": true
}
```

---

## 8. Ofertas de Permuta

### Contexto

Ofertas são produtos ou serviços disponibilizados para troca em RT — por Associados, Agências ou pela própria Matriz (ver `AJUSTES.md`, 2026-08-13). Possuem localização, categoria, valor em RT, quantidade e status, e pertencem a uma `Conta` genérica (`contaId`), não mais exclusivamente a um Associado.

### Endpoints

| Método | Rota | Descrição | Role mínimo | Auth |
|---|---|---|---|---|
| POST | `/ofertas` | Criar oferta | `associate_admin`, `associate_operator`, `agency_admin`, `agency_operator`, `superadmin` | ✅ |
| GET | `/ofertas` | Listar ofertas (busca pública) | — | ❌ |
| GET | `/ofertas/:id` | Detalhar oferta | — | ❌ |
| PUT | `/ofertas/:id` | Atualizar oferta | `associate_admin`, `associate_operator`, `agency_admin`, `agency_operator`, `superadmin` | ✅ |
| PATCH | `/ofertas/:id/status` | Abrir/fechar/pausar | `associate_admin`, `associate_operator`, `agency_admin`, `agency_operator`, `superadmin` | ✅ |
| GET | `/ofertas/minha-loja` | Listar ofertas da própria conta (Associado, Agência ou Matriz) | `associate_admin`, `associate_operator`, `agency_admin`, `agency_operator`, `superadmin` | ✅ |

`POST`/`PUT`/`PATCH /ofertas*` aceitam também `agency_admin`, `agency_operator` e `superadmin` — cada role opera em nome da própria conta (Associado, Agência ou Matriz), resolvida a partir do `contaId` do JWT.

### Filtros em `GET /ofertas`

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `categoria` | UUID | Filtrar por categoria |
| `cidade` | string | Filtrar por cidade |
| `estado` | string (UF) | Filtrar por estado |
| `valorMin` | number | Valor mínimo em RT |
| `valorMax` | number | Valor máximo em RT |
| `tipoAtendimento` | enum | `presencial`, `online`, `voucher` |
| `page` | number | Paginação (default: 1) |
| `limit` | number | Itens por página (default: 20, max: 100) |

### Regras de Negócio

- Associado precisa de loja `aberta` para criar ofertas; Agência precisa estar `ativo`; Matriz não tem restrição de status para criar ofertas.
- Toda oferta deve ter: título, descrição, categoriaId, valorRT (> 0), quantidadeDisponivel (> 0), cidade, estado.
- Limite de venda é validado no momento da compra (permuta/negociada — `limiteVendaMensal`/`limiteVendaTotal` do **vendedor**, ver §3 e §9), não na criação da oferta.
- Quando `quantidadeDisponivel` chega a zero, a oferta é automaticamente fechada (via job BullMQ `offer.close`).
- Ofertas fechadas ou de associados com loja fechada não aparecem na listagem pública.
- Status possíveis: `aberta`, `fechada`, `pausada`.
- Usuários só podem editar/fechar ofertas da própria conta (Associado, Agência ou Matriz).
- `associadoId` agora é opcional — só preenchido quando a oferta pertence a um Associado (mantido por compatibilidade/consulta). `contaId` é o campo obrigatório que identifica o dono real da oferta (Associado, Agência ou Matriz), via `Conta.entityType`.

### Payload de Criação
```json
{
  "titulo": "Almoço Executivo",
  "descricao": "Prato feito completo com sobremesa.",
  "categoriaId": "uuid-da-categoria",
  "valorRT": 50,
  "quantidadeDisponivel": 100,
  "tipoAtendimento": ["presencial"],
  "cidade": "Arapiraca",
  "estado": "AL"
}
```

---

## 9. Transações RT

### Contexto

Toda movimentação de RT entre contas. Tipos: `permuta` (compra de oferta do marketplace), `negociada` (negociação direta entre associados, fora do marketplace), `transferencia` (entre contas), `credito` (injeção pela Matriz), `estorno` (reversão de permuta/negociada).

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| POST | `/transacoes/permuta` | Realizar permuta (comprar oferta) | `associate_operator`, `associate_admin`, `agency_operator`, `agency_admin`, `superadmin` |
| POST | `/transacoes/negociada` | Negociação direta com outro associado (sem oferta) | `associate_operator`, `associate_admin`, `agency_operator`, `agency_admin`, `superadmin` |
| PATCH | `/transacoes/:id/avaliar` | Avaliar atendimento do vendedor (1-5 + comentário) — só quem iniciou a transação, checado por `usuarioIniciadorId`, não por role | `associate_operator`, `associate_admin`, `agency_operator`, `agency_admin`, `superadmin` |
| POST | `/transacoes/transferencia` | Transferir RT entre contas | `associate_admin` |
| POST | `/transacoes/credito` | Injetar RT (Matriz → Agência/Associado) | `superadmin` |
| POST | `/transacoes/:id/estorno` | Estornar transação diretamente (sem solicitação) | `superadmin`, `agency_admin` |
| GET | `/transacoes` | Listar transações da conta autenticada (filtra por `contaOrigemId`/`contaDestinoId`) | `associate_operator`, `associate_admin`, `agency_operator`, `agency_admin`, `superadmin` |
| GET | `/transacoes/:id` | Detalhar transação — 404 se a conta autenticada não participou (`contaOrigemId`/`contaDestinoId`) | `associate_operator`, `associate_admin`, `agency_operator`, `agency_admin`, `superadmin` |
| GET | `/associados/diretorio` | Diretório mínimo de associados ativos (id, nome, cidade, estado, tipoAtendimento — sem dados financeiros) — pra escolher parceiro de negociação, ou como opções do filtro "Associado" em Extratos | `associate_operator`, `associate_admin`, `agency_operator`, `agency_admin`, `superadmin` |

### Regras de Negócio

**Permuta:**
- A conta compradora deve ter saldo suficiente — considerando `limiteCredito` da conta compradora (`saldo - valor >= -limiteCredito`), não apenas saldo >= 0.
- `limiteVendaMensal`/`limiteVendaTotal` do **vendedor** não podem estar atingidos (substituem `plano.limiteRT`) — limita quem vende (recebe RT), não quem compra; o comprador já é limitado por `limiteCredito`.
- A oferta deve estar com status `aberta` e `quantidadeDisponivel > 0`.
- Pode ser parcelada (`parcelas`/`totalParcelas` na `Transacao`) sem juros — não é mais limitada pelo plano (`maxParcelas` foi removido, ver §Planos).
- Toda permuta gera um voucher obrigatoriamente.
- Operação atômica (ver fluxo em ARCHITECTURE.md §8).
- `/transacoes/permuta` e `/transacoes/negociada` aceitam também `agency_admin`/`agency_operator`/`superadmin` — o comprador pode ser Associado, Agência ou Matriz, resolvido a partir do `contaId` do JWT. A comissão da plataforma (`comissaoBRL`) sempre usa o plano de **quem compra** (Associado ou Agência); quando o comprador é a Matriz, não há comissão (Matriz não tem plano). Comissão de gerente (`comissao_gerente`) só é gerada quando o comprador é um Associado com `gerenteId` vinculado — Agência e Matriz nunca geram comissão de gerente.

**Transferência:**
- Somente `associate_admin` pode iniciar transferências.
- Conta de destino deve existir e estar ativa.
- Não gera voucher — apenas registro no extrato.

**Crédito:**
- Exclusivo da Matriz.
- Cria `movimentacao_conta` de crédito na conta de destino.
- Registra como `tipo: credito` na tabela `transacao`.

**Negociação direta (`negociada`):**
- Fora do marketplace de Ofertas — o comprador escolhe qualquer associado ativo (via `GET /associados/diretorio`) e define o `valorRT` diretamente, sem oferta publicada.
- **Sempre em RT** — não existe valor em dinheiro real (BRL) numa negociação direta. RT é a moeda interna do sistema e não circula para fora dele (ver `ARCHITECTURE.md §4`).
- Mesmas validações de saldo do comprador (`limiteCredito`) e limite de venda do vendedor (`limiteVendaMensal`/`limiteVendaTotal`) que a permuta.
- Não decrementa estoque de oferta (não há oferta envolvida) — `quantidade` fica `null`.
- Gera voucher, comissão da plataforma e comissão de gerente, igual à permuta.
- Não é permitido negociar consigo mesmo.
- `negociada()` como **vendedor** continua exigindo um Associado (`vendedorId` aponta sempre para `Associado.id`) — Agência/Matriz vendendo por negociação direta (sem oferta) não é suportado nesta rodada (ver `docs/tech-debt.md`).

**Avaliação (`avaliar`):**
- Apenas o `usuarioIniciador` (quem fez a compra) pode avaliar, e só uma vez por transação.
- Aplica-se a `permuta` e `negociada`, apenas em transações `concluida`.
- Nota de 1 a 5 (`notaAtendimento`) + comentário opcional (`comentarioAvaliacao`).

**Estorno direto:**
- Reverte os movimentos de uma permuta ou negociada (débito volta para comprador, crédito volta para vendedor).
- Só pode ser realizado por `superadmin` ou `agency_admin` da agência responsável.
- Não é permitido estornar transações com mais de 30 dias.
- Valida que a conta que recebeu o valor original ainda tem saldo suficiente para a reversão — se o RT já foi gasto/transferido, retorna `INSUFFICIENT_BALANCE` (422) em vez de erro genérico.
- Gera novo voucher de estorno.
- A quantidade da oferta é restaurada de acordo com `Transacao.quantidade` da permuta original (não é sempre +1 — reflete exatamente quantas unidades foram compradas). Não se aplica a `negociada` (sem oferta).
- Este endpoint executa a reversão **imediatamente**. Para o fluxo de solicitação/aprovação (usado pelas telas de "Solicitar estorno"/"Cancelar voucher"), ver §12.

### Payload de Permuta
```json
{
  "ofertaId": "uuid-da-oferta",
  "quantidade": 2,
  "parcelas": 1
}
```

### Payload de Negociação Direta
```json
{
  "vendedorId": "uuid-do-associado-vendedor",
  "valorRT": 200,
  "parcelas": 1,
  "descricao": "Negociação combinada por telefone"
}
```

### Payload de Avaliação
```json
{
  "notaAtendimento": 5,
  "comentarioAvaliacao": "Ótimo atendimento, recomendo"
}
```

### Payload de Transferência
```json
{
  "contaDestinoId": "uuid-da-conta-destino",
  "valorRT": 200,
  "descricao": "Pagamento de serviço"
}
```

### Payload de Crédito (Matriz)
```json
{
  "contaDestinoId": "uuid-da-conta",
  "valorRT": 10000,
  "descricao": "Crédito inicial de ativação"
}
```

---

## 10. Vouchers

### Contexto

Vouchers são comprovantes gerados a cada permuta. Contêm dados da transação, das partes envolvidas e um código único de verificação.

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| GET | `/vouchers/:id` | Detalhar voucher | `associate_operator` |
| GET | `/vouchers/:id/pdf` | Download do PDF do voucher | `associate_operator` |
| GET | `/vouchers/verificar/:codigo` | Verificar autenticidade | público |

### Regras de Negócio

- Voucher é gerado automaticamente via job BullMQ após confirmação da permuta.
- Contém: código único (UUID), data/hora, associado comprador, associado vendedor, oferta, valor RT, parcelas, status da transação.
- Voucher de estorno é gerado quando uma transação é revertida.
- O PDF é gerado sob demanda (`GET /vouchers/:id/pdf`) e cacheado no Redis por 1 hora.
- `GET /vouchers/verificar/:codigo` é público — permite que terceiros confirmem a autenticidade de um voucher.

---

## 11. Relatórios e Extratos

### Contexto

Consultas financeiras e operacionais. O extrato reflete as movimentações da conta RT. Relatórios consolidam dados para gestão.

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| GET | `/extrato` | Extrato de movimentações da conta autenticada (`contaId` do JWT) | `associate_operator`, `associate_admin`, `agency_operator`, `agency_admin`, `superadmin` |
| GET | `/extrato/saldo` | Saldo atual da conta autenticada | `associate_operator`, `associate_admin`, `agency_operator`, `agency_admin`, `superadmin` |
| GET | `/relatorios/permutas` | Transações — todos os tipos por padrão, ou só um tipo via `?tipo=permuta`. `associate_admin` vê as próprias; `agency_admin` vê a agência + associados geridos; `superadmin` vê tudo, sem filtro | `associate_admin`, `agency_admin`, `superadmin` |
| GET | `/relatorios/comissoes` | Relatório de comissões da plataforma (BRL) | `agency_admin`, `superadmin` |
| GET | `/relatorios/comissoes-gerentes` | Relatório de comissões de todos os gerentes | `agency_admin`, `superadmin` |
| GET | `/relatorios/uso-plano` | Quanto o associado já **vendeu** este mês vs. `limiteVendaMensal` (substituiu `plano.limiteRT`) | `associate_admin` |
| GET | `/relatorios/associados` | Consolidado de associados | `agency_admin`, `superadmin`, `gerente` (apenas os próprios) |
| GET | `/relatorios/emissao-matriz` | Emissão de RT — circulação atual + 4 caminhos de emissão/queima, ver seção própria abaixo | `superadmin` |

### Filtros comuns

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `dataInicio` | ISO 8601 | Início do período |
| `dataFim` | ISO 8601 | Fim do período |
| `tipo` | enum | `credito`, `debito`, `permuta`, `transferencia`, `estorno` |
| `page` | number | Paginação |
| `limit` | number | Itens por página (max: 100) |

### Regras de Negócio

- O extrato deve refletir **todas** as movimentações da conta (entradas e saídas).
- O saldo exibido deve ser sempre consistente com a tabela `conta` (não recalculado via SUM).
- Usuários de um Associado só veem dados do próprio Associado.
- `agency_admin` vê dados consolidados de todos os Associados da sua agência.
- `superadmin` acessa dados globais.
- Relatórios de comissão exibem valores em BRL, separados dos movimentos em RT.
- Exportação de extrato disponível em CSV — endpoint: `GET /extrato?format=csv`.

### Exemplo de resposta do extrato
```json
{
  "success": true,
  "data": {
    "saldoAtual": 1250.00,
    "movimentacoes": [
      {
        "id": "uuid",
        "tipo": "debito",
        "tipoTransacao": "permuta",
        "valor": 50.00,
        "descricao": "Compra: Almoço Executivo - Padaria Central",
        "transacaoId": "uuid-da-transacao",
        "voucherId": "uuid-do-voucher",
        "criadoEm": "2026-04-15T14:30:00Z",
        "saldoApos": 1250.00
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### `GET /relatorios/emissao-matriz` — detalhe

Nenhum outro relatório dá visão unificada de quanto RT foi criado ou destruído no sistema — cada caminho grava de um jeito diferente (ver `docs/tech-debt.md`, entrada "Taxa de Manutenção..." não, a de emissão). Este endpoint cruza os 4 caminhos:

1. **`injecaoDireta`** — `POST /transacoes/credito` (`Transacao{tipo:'credito', contaOrigemId:null}`), filtrado por `criadoEm`.
2. **`creditoAprovado`** — fluxo de solicitação do associado aprovado pela Matriz (`SolicitacaoCredito{status:'aprovado'}`), filtrado por `atualizadoEm` (data da decisão, não da solicitação original).
3. **`queima`** — `Cobranca` em RT quitada sem agência vinculada (`Cobranca{pago:true, valorRT≠null, agenciaId:null}`), filtrado por `atualizadoEm`. Reduz `emissaoLiquida` mesmo a perna de crédito indo pra Matriz (ver `docs/tech-debt.md`) — o RT saiu de circulação do lado de quem devia.
4. **`compraMatriz`** — Matriz comprando no mercado normal (`Transacao{tipo IN (permuta,negociada), contaOrigemId: contaDaMatriz}`), filtrado por `criadoEm`. **Informativo, não entra em `emissaoLiquida`** — é zero-soma (débito da Matriz, crédito de quem vendeu), não muda o total em circulação.

`circulacaoAtual` = `SUM(conta.saldo) WHERE entityType != 'matriz'` — sempre instantâneo, **ignora** `dataInicio`/`dataFim`. É o total de RT que já existe hoje (criado e não destruído), não um valor do período. `emissaoLiquida = injecaoDireta + creditoAprovado − queima`, escopado ao período pedido (ou histórico completo, se nenhuma data for passada) — quando não há `compraMatriz` no histórico, `emissaoLiquida` acumulado desde o início bate exatamente com `circulacaoAtual` (validado empiricamente).

```json
{
  "success": true,
  "data": {
    "circulacaoAtual": 300,
    "periodo": { "dataInicio": null, "dataFim": null },
    "injecaoDireta": { "total": 500, "quantidade": 1 },
    "creditoAprovado": { "total": 0, "quantidade": 0 },
    "queima": { "total": 200, "quantidade": 1 },
    "compraMatriz": { "total": 0, "quantidade": 0 },
    "emissaoLiquida": 300
  }
}
```

---

## 12. Solicitações de Crédito RT

Fluxo de solicitação de injeção de saldo RT para associados, com aprovação hierárquica.

### Fluxo de Status

```
em_analise → encaminhado → aprovado | negado
```

### Endpoints

| Método | Rota | Descrição | Role |
|---|---|---|---|
| POST | `/creditos` | Solicitar crédito | `associate_admin`, `associate_operator` |
| GET | `/creditos/meus` | Minhas solicitações | `associate_admin`, `associate_operator` |
| PUT | `/creditos/:id` | Atualizar solicitação (enquanto em_analise) | `associate_admin`, `associate_operator` |
| DELETE | `/creditos/:id` | Excluir solicitação (enquanto em_analise) | `associate_admin`, `associate_operator` |
| GET | `/creditos/filhos` | Solicitações dos associados da agência | `agency_admin`, `agency_operator` |
| PATCH | `/creditos/:id/encaminhar` | Encaminhar para Matriz | `agency_admin`, `superadmin` |
| GET | `/creditos/matriz` | Solicitações encaminhadas (Matriz) | `superadmin` |
| PATCH | `/creditos/:id/aprovar` | Aprovar e injetar RT na conta | `superadmin` |
| PATCH | `/creditos/:id/negar` | Negar solicitação | `superadmin` |
| GET | `/creditos` | Todas as solicitações | `superadmin` |

### Regras de Negócio

- Aprovação injeta RT atomicamente via `prisma.$transaction` (movimentacao_conta + saldo).
- Não é possível editar ou excluir solicitações com status `aprovado` ou `negado`.
- O campo `valorSolicitado` é em RT.
- `agency_admin` só encaminha (`PATCH /creditos/:id/encaminhar`) solicitações dos próprios associados — outra agência recebe `404` (não `403`, pra não confirmar a existência do id). `superadmin` encaminha qualquer uma.
- `GET /creditos/matriz` mostra `encaminhado`/`aprovado`/`negado` **e também** `em_analise` quando o associado não tem `agenciaId` (cadastrado direto pela Matriz) — sem Agência no meio não tem quem encaminhar.
- `PATCH /creditos/:id/aprovar` e `/negar` exigem `respostaMatriz` (mínimo 10 caracteres) no body — mesma regra do Estorno (§17).

---

## 13. Cobranças / Faturas (BRL ou RT)

Registro de cobranças associadas a contas — taxas de plano, manutenção, inscrição (BRL ou RT) e comissão da plataforma (BRL, gerada automaticamente após cada permuta/negociação).

### Endpoints

| Método | Rota | Descrição | Role |
|---|---|---|---|
| POST | `/cobrancas` | Criar cobrança | `superadmin` |
| GET | `/cobrancas` | Todas as cobranças | `superadmin` |
| GET | `/cobrancas/minhas` | Cobranças da entidade logada | qualquer autenticado |
| GET | `/cobrancas/manutencao-anual` | Situação da taxa de manutenção anual (todo Associado/Agência com plano ativo) | `superadmin` |
| PATCH | `/cobrancas/:id/quitar` | Quitar cobrança | `superadmin`, `agency_admin` |
| DELETE | `/cobrancas/:id` | Remover cobrança | `superadmin` |

### Regras de Negócio

- `GET /cobrancas/minhas` detecta automaticamente se é associado ou agência e retorna as cobranças correspondentes.
- Agência vê cobranças próprias + dos seus associados.
- Cobranças já quitadas não podem ser quitadas novamente.
- Toda cobrança tem `valorBRL` OU `valorRT` preenchido (nunca os dois nulos — validado por CHECK no banco).
- **Quitar cobrança em BRL**: apenas marca `pago: true`. O pagamento acontece fora do sistema (PIX/boleto) — o endpoint só reconcilia manualmente.
- **Quitar cobrança em RT**: move o RT de verdade, de forma atômica. Debita `contaId` (valida saldo suficiente antes, considerando `limiteCredito` do associado/agência devedora — retorna `INSUFFICIENT_BALANCE` se ultrapassar), credita a conta de `agenciaId` se a cobrança tiver uma agência vinculada. Sem agência, credita a própria conta da Matriz (ela é quem emitiu esse RT no fluxo de inscrição — contraparte natural; toda quitação em RT sempre tem as duas pernas, débito e crédito).
- **Comissão da plataforma**: gerada automaticamente pelo job `commission.calculate` após cada `permuta`/`negociada` concluída — cria uma `Cobranca` (BRL) vinculada à transação (`transacaoId`), cobrada do comprador. Idempotente (não duplica se o job reprocessar).
- **`tipo`** (`inscricao | manutencao | comissao | outro`) — discrimina a origem da cobrança; `POST /cobrancas` aceita `tipo` no body (default `outro`). Cobranças de inscrição (`associate.service.ts`) e de comissão da plataforma (job `commission.calculate`) já se auto-classificam.
- **Manutenção anual (`GET /cobrancas/manutencao-anual`)**: sempre 100% manual — não existe job automático que cria a cobrança nem bloqueio automático por atraso. A Matriz cria manualmente via `POST /cobrancas` (com `tipo: 'manutencao'`) quando decide cobrar; o endpoint de leitura só calcula, pra cada Associado/Agência com `plano.taxaManutencaoAnual > 0`, qual o próximo vencimento esperado (1 ano após o cadastro, ou 1 ano após o vencimento da última cobrança de manutenção paga, no dia fixo de `diaVencimentoFatura`, clampado pro último dia do mês quando o dia não existe — ex: dia 30 em fevereiro) e se há uma pendência em aberto (`emAberto`, `diasAtraso`). Bloqueio do inadimplente continua manual (mudar `status` pra `suspenso`), sem automação — decisão explícita do produto.

---

## 14. Upload de Arquivos (Backblaze B2)

Upload de imagens para ofertas e outros recursos via Backblaze B2 (API compatível com S3).

### Endpoints

| Método | Rota | Descrição | Role |
|---|---|---|---|
| POST | `/upload` | Upload de imagem (multipart/form-data) | qualquer autenticado |
| DELETE | `/upload/:id` | Remover arquivo | `superadmin` |

### Regras de Negócio

- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Tamanho máximo: 5 MB.
- Retorna `{ url, id }` — a `url` deve ser salva no campo `imagemUrl` da oferta.
- Chave configurada via variáveis de ambiente `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `B2_ENDPOINT`, `B2_PUBLIC_URL`.

---

## 15. Extensões ao Módulo Plano

Campos adicionados ao model `Plano` para suporte ao front:

| Campo | Tipo | Descrição |
|---|---|---|
| `tipoPlano` | `TipoPlano` (agencia/associado/gerente) | Classifica o plano por tipo de entidade |
| `taxaInscricao` | Decimal | Taxa de inscrição em R$ — valor de referência, não vinculado automaticamente à cobrança do associado |
| `taxaManutencaoAnual` | Decimal | Taxa de manutenção anual em R$ — sem cobrança automática implementada ainda (só cadastro) |

---

## 16. Campo `imagemUrl` e `vencimento` em Ofertas

Campos adicionados ao model `Oferta`:

| Campo | Tipo | Descrição |
|---|---|---|
| `imagemUrl` | String? | URL da imagem no Backblaze B2 |
| `vencimento` | DateTime? | Data de vencimento da oferta |

---

## 17. Solicitação de Estorno

### Contexto

Fluxo de solicitação/aprovação para estorno de transações (`permuta` ou `negociada`), mesmo padrão de `SolicitacaoCredito` (§12): `em_analise → encaminhado → aprovado | negado`. Complementa o estorno direto (§9), usado pelas telas "Solicitar estorno" (Transações) e "Cancelar voucher" (Vouchers) — cancelar um voucher é, na prática, estornar a transação por trás dele.

### Endpoints

| Método | Rota | Descrição | Role |
|---|---|---|---|
| POST | `/estornos` | Solicitar estorno de uma transação | `associate_admin`, `associate_operator`, `agency_admin`, `superadmin` |
| GET | `/estornos/minhas` | Minhas solicitações | mesmo grupo acima |
| GET | `/estornos/filhos` | Solicitações envolvendo associados da agência | `agency_admin`, `agency_operator` |
| PATCH | `/estornos/:id/encaminhar` | Encaminhar para a Matriz | `agency_admin`, `superadmin` |
| GET | `/estornos/matriz` | Solicitações encaminhadas (Matriz) | `superadmin` |
| PATCH | `/estornos/:id/aprovar` | Aprovar — executa o estorno de fato | `superadmin` |
| PATCH | `/estornos/:id/negar` | Negar solicitação | `superadmin` |
| GET | `/estornos` | Todas as solicitações | `superadmin` |

### Regras de Negócio

- Só pode solicitar quem é comprador/vendedor da transação, ou `agency_admin`/`superadmin`.
- Apenas transações `permuta` ou `negociada`, ainda não `estornada`, dentro do prazo de 30 dias.
- Não permite duas solicitações simultâneas em andamento (`em_analise`/`encaminhado`) para a mesma transação.
- `agency_admin` só encaminha (`PATCH /estornos/:id/encaminhar`) solicitações da própria agência — outra agência recebe `404` (não `403`, pra não confirmar a existência do id). `superadmin` encaminha qualquer uma.
- Ao aprovar, executa a mesma lógica de estorno direto (§9) — valida saldo suficiente na conta a ser debitada, reverte movimentações, restaura quantidade da oferta (se aplicável), gera voucher de estorno.
- Ao negar, a transação original permanece `concluida` — nenhuma reversão ocorre.
- `motivo` é **obrigatório** (mínimo 10 caracteres) — é o que a Matriz usa pra analisar e decidir aprovar ou negar.
- `PATCH /estornos/:id/aprovar` e `/negar` exigem `respostaMatriz` (mínimo 10 caracteres) no body — justificativa da Matriz, pra quem pediu entender a decisão.
- `GET /estornos/matriz` mostra `encaminhado`/`aprovado`/`negado` **e também** `em_analise` quando nenhuma das partes (comprador/vendedor Associado ou a própria Agência via contaOrigem/contaDestino) pertence a uma Agência — sem Agência no meio não tem quem encaminhar, então a Matriz precisa ver e aprovar direto. Quando existe Agência, `em_analise` só aparece pra Matriz depois de encaminhado.

### Payload de Solicitação
```json
{
  "transacaoId": "uuid-da-transacao",
  "motivo": "Produto não entregue"
}
```
