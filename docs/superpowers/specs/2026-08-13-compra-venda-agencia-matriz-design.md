# Compra e Venda por Agência e Matriz — Design

> Spec de arquitetura. Implementação via `docs/superpowers/plans/` (superpowers:writing-plans), não incluída aqui.

## Contexto

Hoje, comprar (`permuta`/`negociada`) e vender (criar `Oferta`) só funciona entre Associados. Agência e Matriz não participam do fluxo comercial — só emitem/injetam RT (Matriz) ou não têm papel ativo nenhum na compra/venda (Agência). O pedido: Agência e Matriz precisam comprar e vender RT com a mesma segurança (saldo, limites, ledger) que já existe pra Associado.

## Achados da investigação (estado atual)

- `Transacao.compradorId`/`vendedorId` têm FK física contra a tabela `associado` — não são polimórficos. Um id de Agência/Matriz aí quebraria a constraint do banco.
- `Oferta.associadoId` é obrigatório e não-nullable — não existe "oferta da Agência/Matriz" no schema.
- **Matriz não tem `Conta` real no banco** — `entityId` da Matriz é a string literal `"matriz"` (`auth.service.ts:50`), sem saldo rastreável, sem linha na tabela `conta`.
- `Agencia` **já tem** `limiteCredito`, `limiteVendaMensal`, `limiteVendaTotal` e `planoId` no schema (`schema.prisma:162-166`) — nunca lidos em `transaction.service.ts`. Alguém deixou o campo pronto, nunca foi ligado.
- `Agencia.status: StatusGeral` já existe (ativo/suspenso/inativo) — não precisa de conceito de "loja aberta/fechada" como Associado (decisão do usuário).
- Worker `commissionGerente` (`bullmq.ts:108-139`) lê `transacao.comprador.gerenteId` via relação tipada pra Associado — se comprador não for Associado, a query resolve `null` e a comissão simplesmente não é calculada, **sem erro nenhum**. Comportamento correto pro caso de negócio (só Associado com gerente gera comissão), mas silencioso hoje — vira uma saída explícita.
- `Conta.limiteCredito` (coluna genérica, já denormalizada) e `MovimentacaoConta` (ledger) já são agnósticos de entidade — não precisam mudar.
- Guards atuais: só `associate_admin`/`associate_operator` compram/vendem. `agency_admin`/`agency_operator` só têm acesso a `/transacoes/:id/estorno` hoje.

## Decisões de negócio (confirmadas com o usuário)

1. **Vitrine de oferta:** Agência e Matriz vendem por `Oferta` publicada, igual Associado (não só negociação direta).
2. **Comissão:** sem comissão de gerente pra compra de Agência/Matriz (gerente só existe pra Associado). Comissão da plataforma usa o `percentualComissao` do `Plano` vinculado à Agência (campo `Agencia.planoId`, já existe). Matriz não gera comissão nenhuma — é quem emite RT.
3. **Conta da Matriz:** conta real, saldo rastreável no ledger, mas **sem limite** de crédito/venda — na prática, `limiteCredito` de valor bem alto (não uma exceção especial na constraint do banco).
4. **Quem opera:** `agency_admin`/`agency_operator` operam em nome da própria Agência; `superadmin` opera em nome da Matriz. Sem operar em nome de terceiros.
5. **Loja da Agência:** não precisa — só `status: ativo` já é suficiente pra bloquear operação.

## Arquitetura

### Princípio: apontar pra `Conta`, não pra `Associado`

`Conta` já é a entidade agnóstica do sistema (`entityType: matriz|agencia|associado`, `limiteCredito` próprio). Em vez de inventar um padrão novo (campo polimórfico tipo+id), `Transacao` e `Oferta` passam a referenciar `Conta` diretamente:

- `Transacao.compradorId`/`vendedorId`: FK trocada de `associado` pra `conta`. Migration com backfill: todo comprador/vendedor histórico já tem uma `Conta` 1:1 (`Conta.associadoId` único), então `UPDATE transacao SET "compradorId" = (SELECT id FROM conta WHERE "associadoId" = transacao."compradorId")` preserva 100% do histórico sem perda.
- `Oferta.associadoId` → `Oferta.contaId`: mesmo padrão de backfill.

Essa é a parte estruturalmente mais delicada — toca dado histórico de transação. Precisa validação com dado real antes/depois (mesmo padrão já usado nas migrations de `limiteCredito`/rename de `taxaInscricao`).

### Conta da Matriz

Seed cria uma `Conta` com `entityType: 'matriz'`, `associadoId`/`agenciaId` nulos, `limiteCredito` de valor alto (ex: `999999999999`). Sem coluna nova, sem exceção na constraint — só um valor que na prática nunca bloqueia.

### Validações por tipo de conta

`permuta()`, `negociada()` e `offer.service.ts::create()` passam a resolver saldo/limite/comissão/status de acordo com o `entityType` da conta envolvida — um branch por tipo, reaproveitando as funções já existentes de `limites.ts` (`saldoSuficienteParaDebito`, `getLimiteCreditoDaConta`, `validarLimiteVenda`), que já são agnósticas de entidade por operarem sobre `Conta`.

| | Associado (hoje) | Agência (novo) | Matriz (novo) |
|---|---|---|---|
| Status que bloqueia | `statusLoja` + `status` | só `status` | nenhum |
| Limite de crédito | `limiteCredito` do Associado | `limiteCredito` da Agência | valor alto (sem bloqueio prático) |
| Limite de venda | `limiteVendaMensal/Total` do Associado | `limiteVendaMensal/Total` da Agência | nenhum (sem checagem) |
| Comissão da plataforma | `plano.percentualComissao` do Associado | `plano.percentualComissao` da Agência (via `Agencia.planoId`) | nenhuma |
| Comissão do gerente | sim, se `gerenteId` setado | não | não |

### Comissão do gerente — saída explícita

Worker `commissionGerente` ganha uma checagem explícita no início: só processa se a conta compradora pertence a um Associado com `gerenteId` setado; caso contrário, retorna cedo com um comentário explicando o motivo (documenta o comportamento que já existe hoje, mas de forma intencional em vez de acidental).

### Guards

- `POST /ofertas`, `PUT /ofertas/:id`, `PATCH /ofertas/:id/status`, `/transacoes/permuta`, `/transacoes/negociada` ganham `agency_admin`/`agency_operator` (operando pela própria Agência) e `superadmin` (operando pela Matriz).
- Resolução de "qual conta eu sou" continua vindo do JWT (`entityType`/`entityId`) — controller busca a `Conta` certa (`associado.conta`, `agencia.conta`, ou a conta fixa da Matriz) antes de chamar o service.

## Fora de escopo desta rodada

- Agência ter conceito de "loja aberta/fechada" (decisão: não precisa).
- Matriz ter limite de crédito/venda configurável (decisão: sem limite).
- Mudar a forma como `credito()` injeta RT (Matriz creditando associado sem debitar origem) — esse fluxo já existe e não muda; comprar/vender é um fluxo novo e separado, ambos coexistem.
- Comissão de gerente pra compra de Agência/Matriz (decisão: não existe).

## Referência cruzada

- `docs/tech-debt.md` — atualizar removendo/ajustando qualquer nota que hoje descreva Agência como não-participante do fluxo comercial, se houver.
- `AJUSTES.md` — nova entrada quando implementado, seguindo o padrão histórico do arquivo.
- `api/docs/SPEC.md` §8 (Ofertas), §13/§9 (Transações) — precisam refletir Agência/Matriz como comprador/vendedor válido.
- `api/docs/SCHEMA.md` — `Transacao.compradorId`/`vendedorId` e `Oferta.contaId` precisam ser redocumentados como referência a `Conta`, não mais a `Associado`.
- `CLAUDE.md` (raiz) — a hierarquia documentada (`Matriz → Agência → Associado → Usuários`) ganha uma nota de que Matriz e Agência também participam do fluxo comercial, não só de emissão/gestão.
