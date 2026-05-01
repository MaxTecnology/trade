# TASKS.md — Rede Trade API

> Arquivo de progresso da construção da API.
> O Claude Code deve marcar cada tarefa como concluída ao finalizá-la.
> Formato: `- [ ]` pendente → `- [x]` concluído

---

## Legenda de Status

| Símbolo | Significado |
|---|---|
| `[ ]` | Pendente |
| `[x]` | Concluído |
| `[~]` | Em andamento |
| `[!]` | Bloqueado / requer atenção |

---

## ETAPA 1 — Setup do Projeto

- [x] Inicializar projeto Node.js com TypeScript
- [x] Instalar dependências de produção
- [x] Instalar dependências de desenvolvimento
- [x] Configurar `tsconfig.json`
- [x] Configurar `eslint` + `prettier`
- [x] Criar `.env.example` com todas as variáveis
- [x] Criar `.gitignore`

---

## ETAPA 2 — Docker

- [x] Criar `Dockerfile` multi-stage (build + production)
- [x] Criar `docker-compose.yml` com serviços: api, postgres, redis
- [x] Configurar healthcheck no postgres
- [x] Configurar healthcheck no redis
- [x] Configurar dependência de startup (api aguarda postgres e redis)
- [x] Configurar volumes persistentes para postgres e redis
- [x] Testar `docker-compose up` sem erros

---

## ETAPA 3 — Prisma e Banco de Dados

- [x] Criar `prisma/schema.prisma` com todos os models do SCHEMA.md §2
- [x] Adicionar todos os enums
- [x] Adicionar todos os índices do SCHEMA.md §3
- [x] Adicionar constraints SQL do SCHEMA.md §4
- [ ] Criar migration inicial
- [x] Criar `prisma/seed.ts` com superadmin, planos e categorias iniciais (SCHEMA.md §5)
- [x] Testar seed sem erros

---

## ETAPA 4 — Estrutura Base da Aplicação

- [x] Criar estrutura de pastas de módulos (`src/modules/`)
- [x] Criar estrutura de pastas compartilhadas (`src/shared/`)
- [x] Implementar `src/app.ts` (registro de plugins e rotas)
- [x] Implementar `src/server.ts` (bootstrap, conexão DB e Redis)
- [x] Implementar error handler global
- [x] Implementar padrão de resposta de sucesso (`{ success, data, meta }`)
- [x] Implementar padrão de resposta de erro (`{ success, error }`)
- [x] Implementar todos os códigos de erro customizados (ARCHITECTURE.md §12)
- [x] Configurar Swagger/OpenAPI (`/docs`)
- [x] Configurar cliente Prisma singleton
- [x] Configurar cliente Redis singleton

---

## ETAPA 5 — Módulo: Autenticação

**Endpoints**
- [x] `POST /auth/login`
- [x] `POST /auth/refresh`
- [x] `POST /auth/logout`
- [x] `GET /auth/me`

**Infraestrutura de Auth**
- [x] Implementar `AuthGuard` (valida JWT, injeta `req.user`)
- [x] Implementar `RoleGuard` (verifica permissão por role)
- [x] Implementar geração de access token (15min)
- [x] Implementar geração de refresh token (7 dias, httpOnly cookie)
- [x] Implementar bloqueio por tentativas de login (5 falhas → 15min via Redis)
- [x] Implementar invalidação de refresh token no logout

**Documentação**
- [x] Criar `docs/http/auth.http` com todos os endpoints

---

## ETAPA 6 — Módulo: Agências

**Endpoints**
- [x] `POST /agencias`
- [x] `GET /agencias`
- [x] `GET /agencias/:id`
- [x] `PUT /agencias/:id`
- [x] `PATCH /agencias/:id/status`
- [x] `GET /agencias/:id/associados`
- [x] `GET /agencias/:id/conta`
- [x] `GET /agencias/:id/gerentes`

**Regras**
- [x] Validar criação de agência master (somente superadmin)
- [x] Validar criação de agência comum (somente agency_admin de master)
- [x] Auto-criar conta RT ao criar agência
- [x] Validar CNPJ único
- [x] Bloquear operações em agências suspensas

**Documentação**
- [x] Criar `docs/http/agencias.http` com todos os endpoints

---

## ETAPA 7 — Módulo: Associados

**Endpoints**
- [x] `POST /associados`
- [x] `GET /associados`
- [x] `GET /associados/:id`
- [x] `PUT /associados/:id`
- [x] `PATCH /associados/:id/status`
- [x] `GET /associados/:id/conta`
- [x] `PATCH /associados/:id/loja`

**Regras**
- [x] Validar vínculo obrigatório com agência e gerente
- [x] Auto-criar conta RT com número sequencial (7 dígitos)
- [x] Validar CNPJ único
- [x] Bloquear operações em associados suspensos
- [x] Vínculo gerente → associado permanente (não permite reatribuição)

**Documentação**
- [x] Criar `docs/http/associados.http` com todos os endpoints

---

## ETAPA 8 — Módulo: Usuários

**Endpoints**
- [x] `POST /usuarios`
- [x] `GET /usuarios`
- [x] `GET /usuarios/:id`
- [x] `PUT /usuarios/:id`
- [x] `PATCH /usuarios/:id/senha`
- [x] `PATCH /usuarios/:id/status`
- [x] `DELETE /usuarios/:id`

**Regras**
- [x] Validar limite de 4 operadores por associado
- [x] Gerar código de operador sequencial (`XXXXXXX-01` até `XXXXXXX-04`)
- [x] Validar e-mail único no sistema
- [x] Auto-criar associate_admin junto com o associado
- [x] Bloquear login de usuários desativados

**Documentação**
- [x] Criar `docs/http/usuarios.http` com todos os endpoints

---

## ETAPA 9 — Módulo: Gerentes

**Endpoints**
- [x] `POST /gerentes`
- [x] `GET /gerentes`
- [x] `GET /gerentes/:id`
- [x] `PUT /gerentes/:id`
- [x] `PATCH /gerentes/:id/status`
- [x] `GET /gerentes/:id/associados`
- [x] `GET /gerentes/:id/comissoes`

**Regras**
- [x] Validar que gerente pertence a uma entidade válida
- [x] Armazenar percentual de comissão individual
- [x] Gerente desativado não pode cadastrar novos associados
- [x] Histórico de comissões preservado mesmo após desativação

**Documentação**
- [x] Criar `docs/http/gerentes.http` com todos os endpoints

---

## ETAPA 10 — Módulo: Planos

**Endpoints**
- [x] `POST /planos`
- [x] `GET /planos`
- [x] `GET /planos/:id`
- [x] `PUT /planos/:id`
- [x] `PATCH /planos/:id/status`

**Regras**
- [x] Validar campos obrigatórios (limiteRT, percentualComissao, periodicidade, maxParcelas)
- [x] Impedir atribuição de plano inativo a novo associado
- [x] Alteração de plano não afeta associados já vinculados retroativamente

**Documentação**
- [x] Criar `docs/http/planos.http` com todos os endpoints

---

## ETAPA 11 — Módulo: Categorias

**Endpoints**
- [x] `POST /categorias`
- [x] `GET /categorias`
- [x] `GET /categorias/:id`
- [x] `PUT /categorias/:id`
- [x] `PATCH /categorias/:id/status`

**Regras**
- [x] Validar hierarquia máxima de 3 níveis
- [x] Validar nome único dentro do mesmo nível pai
- [x] Impedir exclusão de categoria em uso (apenas desativar)
- [x] Categorias inativas não aparecem na listagem pública

**Documentação**
- [x] Criar `docs/http/categorias.http` com todos os endpoints

---

## ETAPA 12 — Módulo: Ofertas de Permuta

**Endpoints**
- [x] `POST /ofertas`
- [x] `GET /ofertas` (busca pública com filtros)
- [x] `GET /ofertas/:id`
- [x] `PUT /ofertas/:id`
- [x] `PATCH /ofertas/:id/status`
- [x] `GET /ofertas/minha-loja`

**Regras**
- [x] Validar loja aberta antes de criar oferta
- [x] Validar limite RT do plano antes de criar oferta
- [x] Implementar filtros: categoria, cidade, estado, valorMin, valorMax, tipoAtendimento
- [x] Implementar paginação (default 20, max 100)
- [x] Registrar job `offer.close` quando quantidade chegar a zero

**Documentação**
- [x] Criar `docs/http/ofertas.http` com todos os endpoints e filtros

---

## ETAPA 13 — Módulo: Transações RT

**Endpoints**
- [x] `POST /transacoes/permuta`
- [x] `POST /transacoes/transferencia`
- [x] `POST /transacoes/credito`
- [x] `POST /transacoes/:id/estorno`
- [x] `GET /transacoes`
- [x] `GET /transacoes/:id`

**Regras — Permuta**
- [x] Validar saldo suficiente da conta compradora
- [x] Validar limite mensal do plano
- [x] Validar oferta aberta e com quantidade disponível
- [x] Implementar parcelamento (sem juros, até maxParcelas do plano)
- [x] Operação atômica via `prisma.$transaction`
- [x] Decrementar quantidade da oferta
- [x] Disparar job `voucher.generate` após conclusão
- [x] Disparar job `commission.calculate` após conclusão
- [x] Disparar job `commission.gerente` após conclusão

**Regras — Transferência**
- [x] Validar saldo suficiente
- [x] Validar conta destino ativa
- [x] Operação atômica

**Regras — Crédito**
- [x] Restrito ao superadmin
- [x] Operação atômica

**Regras — Estorno**
- [x] Validar prazo máximo de 30 dias
- [x] Reverter movimentações (débito volta para comprador)
- [x] Restaurar quantidade da oferta (+1 por unidade)
- [x] Disparar job `voucher.generate` para voucher de estorno

**Documentação**
- [x] Criar `docs/http/transacoes.http` com todos os endpoints

---

## ETAPA 14 — Módulo: Vouchers

**Endpoints**
- [x] `GET /vouchers/:id`
- [x] `GET /vouchers/:id/pdf`
- [x] `GET /vouchers/verificar/:codigo`

**Regras**
- [x] Geração automática via job BullMQ `voucher.generate`
- [x] PDF gerado sob demanda e cacheado no Redis por 1 hora
- [x] Endpoint de verificação público

**Documentação**
- [x] Criar `docs/http/vouchers.http` com todos os endpoints

---

## ETAPA 15 — Módulo: Relatórios e Extratos

**Endpoints**
- [x] `GET /extrato`
- [x] `GET /extrato/saldo`
- [x] `GET /relatorios/permutas`
- [x] `GET /relatorios/comissoes`
- [x] `GET /relatorios/comissoes-gerentes`
- [x] `GET /relatorios/uso-plano`
- [x] `GET /relatorios/associados`

**Regras**
- [x] Implementar filtros: dataInicio, dataFim, tipo, page, limit
- [x] Exportação de extrato em CSV (`?format=csv`)
- [x] Isolamento de dados por entidade (associado vê só os próprios)
- [x] Gerente vê apenas associados que cadastrou
- [x] agency_admin vê consolidado da agência
- [x] superadmin vê dados globais

**Documentação**
- [x] Criar `docs/http/relatorios.http` com todos os endpoints e filtros

---

## ETAPA 16 — Filas Assíncronas (BullMQ)

- [x] Configurar worker base do BullMQ
- [x] Implementar fila `voucher.generate`
- [x] Implementar fila `commission.calculate` (comissão BRL da plataforma)
- [x] Implementar fila `commission.gerente` (comissão BRL do gerente)
- [x] Implementar fila `notification.send` (e-mail de confirmação)
- [x] Implementar fila `offer.close` (fechamento automático de oferta)
- [x] Configurar retry com backoff exponencial em todas as filas
- [x] Configurar dead-letter queue para jobs com falha

---

## ETAPA 17 — Documentação HTTP Final

- [x] Revisar e consolidar todos os arquivos `.http` gerados por módulo
- [x] Garantir que `docs/http/doc.http` contém todas as rotas organizadas por seção
- [x] Adicionar variáveis de ambiente no topo do `doc.http` (`@baseUrl`, `@token`)
- [ ] Testar todos os endpoints do `doc.http` manualmente

---

## ETAPA 18 — Revisão Final

- [x] Validar que todos os guards estão aplicados corretamente em todas as rotas
- [x] Validar que todas as operações financeiras são atômicas
- [x] Validar que `movimentacao_conta` e `comissao_gerente` são imutáveis (sem UPDATE/DELETE)
- [x] Validar que saldo nunca fica negativo (constraint + validação no service)
- [ ] Rodar seed completo e verificar dados
- [x] Verificar se Swagger está documentando todas as rotas
- [ ] Testar `docker-compose up` do zero (fresh build)

---

## Progresso Geral

| Etapa | Status | Observações |
|---|---|---|
| 1 — Setup | `[x]` | Concluído |
| 2 — Docker | `[x]` | Concluído |
| 3 — Prisma | `[~]` | Pendente: migration inicial (usando db push por ora) |
| 4 — Base | `[x]` | Concluído |
| 5 — Auth | `[x]` | Concluído |
| 6 — Agências | `[x]` | Concluído |
| 7 — Associados | `[x]` | Concluído |
| 8 — Usuários | `[x]` | Concluído |
| 9 — Gerentes | `[x]` | Concluído |
| 10 — Planos | `[x]` | Concluído |
| 11 — Categorias | `[x]` | Concluído |
| 12 — Ofertas | `[x]` | Concluído |
| 13 — Transações | `[x]` | Concluído |
| 14 — Vouchers | `[x]` | Concluído |
| 15 — Relatórios | `[x]` | Concluído |
| 16 — Filas BullMQ | `[x]` | Concluído |
| 17 — Doc HTTP | `[~]` | Pendente: testar endpoints manualmente |
| 18 — Revisão Final | `[~]` | Pendente: seed + docker-compose (requer ambiente) |
