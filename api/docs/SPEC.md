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
| GET | `/associados/:id` | Detalhar associado | `agency_admin`, `associate_admin` (próprio) |
| PUT | `/associados/:id` | Atualizar associado | `associate_admin` |
| PATCH | `/associados/:id/status` | Ativar/suspender | `agency_admin` |
| GET | `/associados/:id/conta` | Ver conta RT | `associate_admin` |
| PATCH | `/associados/:id/loja` | Abrir/fechar loja | `associate_admin` |

### Regras de Negócio

- Todo associado deve ser vinculado a uma agência no momento do cadastro.
- Todo associado deve ser vinculado a um **gerente** no momento do cadastro — é o gerente quem realiza o cadastro.
- Um plano deve ser atribuído no momento do cadastro.
- Toda criação de associado gera automaticamente uma conta RT.
- O número da conta é gerado sequencialmente com 7 dígitos: `0000001`.
- Associados possuem um atributo `tipoAtendimento`: `presencial`, `online`, `voucher` (múltiplos permitidos).
- A opção `voucher` só aparece se habilitada nas configurações da plataforma.
- Associados podem ter a loja `aberta` ou `fechada` — loja fechada não aparece nas buscas de ofertas.
- Associados suspensos não podem realizar operações.
- CNPJ deve ser único no sistema.
- O vínculo gerente → associado é **permanente** e não pode ser reatribuído.

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
| PATCH | `/usuarios/:id/senha` | Alterar senha | próprio usuário |
| PATCH | `/usuarios/:id/status` | Ativar/desativar usuário | admin da entidade |
| DELETE | `/usuarios/:id` | Remover usuário | `associate_admin`, `agency_admin` |

### Regras de Negócio

- Máximo de **4 usuários por Associado** (excluindo o `associate_admin` principal).
- E-mail deve ser único no sistema.
- O `associate_admin` principal é criado automaticamente junto com o Associado — não conta no limite dos 4.
- O identificador de operador (`XXXXXXX-01`) é atribuído sequencialmente e não pode ser reutilizado dentro da mesma conta.
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
```json
{
  "success": true,
  "data": {
    "totalComissaoBRL": 1250.50,
    "comissoes": [
      {
        "id": "uuid",
        "transacaoId": "uuid-da-transacao",
        "associadoId": "uuid-do-associado",
        "associadoNome": "Padaria Central",
        "valorTransacaoRT": 200.00,
        "comissaoPlataformaBRL": 50.00,
        "percentualGerente": 10.0,
        "comissaoGerenteBRL": 5.00,
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

Planos definem as regras financeiras de um Associado: limite de movimentação RT, percentual de comissão da plataforma, periodicidade e parcelamento.

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| POST | `/planos` | Criar plano | `superadmin` |
| GET | `/planos` | Listar planos | `superadmin`, `agency_admin` |
| GET | `/planos/:id` | Detalhar plano | `superadmin`, `agency_admin` |
| PUT | `/planos/:id` | Atualizar plano | `superadmin` |
| PATCH | `/planos/:id/status` | Ativar/desativar plano | `superadmin` |

### Regras de Negócio

- Todo plano deve ter: nome, `limiteRT` (valor numérico), `percentualComissao`, `periodicidade` (`mensal` ou `anual`), `maxParcelas`.
- Planos inativos não podem ser atribuídos a novos Associados.
- Alterar um plano não afeta retroativamente Associados já vinculados — é necessário reatribuir explicitamente.
- O limite RT é de **movimentação** (soma de débitos no período). Ao atingir, novas permutas são bloqueadas.
- Parcelamento: sem juros, máximo de `maxParcelas` vezes. Cada parcela é uma `movimentacao_conta` agendada.

### Payload de Criação
```json
{
  "nome": "Plano Básico",
  "limiteRT": 5000,
  "percentualComissao": 5.0,
  "periodicidade": "mensal",
  "maxParcelas": 3,
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

Ofertas são produtos ou serviços disponibilizados por Associados para troca em RT. Possuem localização, categoria, valor em RT, quantidade e status.

### Endpoints

| Método | Rota | Descrição | Role mínimo | Auth |
|---|---|---|---|---|
| POST | `/ofertas` | Criar oferta | `associate_admin`, `associate_operator` | ✅ |
| GET | `/ofertas` | Listar ofertas (busca pública) | — | ❌ |
| GET | `/ofertas/:id` | Detalhar oferta | — | ❌ |
| PUT | `/ofertas/:id` | Atualizar oferta | `associate_admin`, `associate_operator` | ✅ |
| PATCH | `/ofertas/:id/status` | Abrir/fechar/pausar | `associate_admin`, `associate_operator` | ✅ |
| GET | `/ofertas/minha-loja` | Listar ofertas do associado | `associate_admin`, `associate_operator` | ✅ |

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

- O Associado deve estar com loja `aberta` para criar ofertas.
- Toda oferta deve ter: título, descrição, categoriaId, valorRT (> 0), quantidadeDisponivel (> 0), cidade, estado.
- O Associado não pode ultrapassar o `limiteRT` do plano ao criar/executar a oferta.
- Quando `quantidadeDisponivel` chega a zero, a oferta é automaticamente fechada (via job BullMQ `offer.close`).
- Ofertas fechadas ou de associados com loja fechada não aparecem na listagem pública.
- Status possíveis: `aberta`, `fechada`, `pausada`.
- Usuários só podem editar/fechar ofertas do próprio Associado.

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

Toda movimentação de RT entre contas. Tipos: `permuta` (compra de oferta), `transferencia` (entre contas), `credito` (injeção pela Matriz), `estorno` (reversão de permuta).

### Endpoints

| Método | Rota | Descrição | Role mínimo |
|---|---|---|---|
| POST | `/transacoes/permuta` | Realizar permuta (comprar oferta) | `associate_operator` |
| POST | `/transacoes/transferencia` | Transferir RT entre contas | `associate_admin` |
| POST | `/transacoes/credito` | Injetar RT (Matriz → Agência/Associado) | `superadmin` |
| POST | `/transacoes/:id/estorno` | Estornar transação | `superadmin`, `agency_admin` |
| GET | `/transacoes` | Listar transações da entidade | `associate_operator` |
| GET | `/transacoes/:id` | Detalhar transação | `associate_operator` |

### Regras de Negócio

**Permuta:**
- A conta compradora deve ter saldo suficiente.
- O limite mensal do plano não pode estar atingido.
- A oferta deve estar com status `aberta` e `quantidadeDisponivel > 0`.
- Pode ser parcelada em até `maxParcelas` do plano — sem juros.
- Toda permuta gera um voucher obrigatoriamente.
- Operação atômica (ver fluxo em ARCHITECTURE.md §8).

**Transferência:**
- Somente `associate_admin` pode iniciar transferências.
- Conta de destino deve existir e estar ativa.
- Não gera voucher — apenas registro no extrato.

**Crédito:**
- Exclusivo da Matriz.
- Cria `movimentacao_conta` de crédito na conta de destino.
- Registra como `tipo: credito` na tabela `transacao`.

**Estorno:**
- Reverte os movimentos de uma permuta (débito volta para comprador, crédito volta para vendedor).
- Só pode ser realizado por `superadmin` ou `agency_admin` da agência responsável.
- Não é permitido estornar transações com mais de 30 dias.
- Gera novo voucher de estorno.
- A quantidade da oferta é restaurada (+1).

### Payload de Permuta
```json
{
  "ofertaId": "uuid-da-oferta",
  "quantidade": 2,
  "parcelas": 1
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
| GET | `/extrato` | Extrato de movimentações da conta | `associate_operator` |
| GET | `/extrato/saldo` | Saldo atual da conta | `associate_operator` |
| GET | `/relatorios/permutas` | Relatório de permutas | `associate_admin`, `agency_admin` |
| GET | `/relatorios/comissoes` | Relatório de comissões da plataforma (BRL) | `agency_admin`, `superadmin` |
| GET | `/relatorios/comissoes-gerentes` | Relatório de comissões de todos os gerentes | `agency_admin`, `superadmin` |
| GET | `/relatorios/uso-plano` | Uso do limite do plano | `associate_admin` |
| GET | `/relatorios/associados` | Consolidado de associados | `agency_admin`, `superadmin`, `gerente` (apenas os próprios) |

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

---

## 13. Cobranças / Faturas BRL

Registro de cobranças em BRL associadas a contas (taxas de plano, manutenção, inscrição).

### Endpoints

| Método | Rota | Descrição | Role |
|---|---|---|---|
| POST | `/cobrancas` | Criar cobrança | `superadmin` |
| GET | `/cobrancas` | Todas as cobranças | `superadmin` |
| GET | `/cobrancas/minhas` | Cobranças da entidade logada | qualquer autenticado |
| PATCH | `/cobrancas/:id/quitar` | Marcar como paga | `superadmin`, `agency_admin` |
| DELETE | `/cobrancas/:id` | Remover cobrança | `superadmin` |

### Regras de Negócio

- `GET /cobrancas/minhas` detecta automaticamente se é associado ou agência e retorna as cobranças correspondentes.
- Agência vê cobranças próprias + dos seus associados.
- Cobranças já quitadas não podem ser quitadas novamente.

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
| `taxaInscricaoRT` | Decimal | Taxa de inscrição em RT cobrada ao criar associado |
| `taxaManutencaoAnualRT` | Decimal | Taxa de manutenção anual em RT |

---

## 16. Campo `imagemUrl` e `vencimento` em Ofertas

Campos adicionados ao model `Oferta`:

| Campo | Tipo | Descrição |
|---|---|---|
| `imagemUrl` | String? | URL da imagem no Backblaze B2 |
| `vencimento` | DateTime? | Data de vencimento da oferta |
