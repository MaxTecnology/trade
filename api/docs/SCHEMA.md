# SCHEMA.md — Modelo de Dados

## 1. Diagrama de Entidades (Resumo)

```
matriz (instância única, seed)
  │
  ├── agencia (tipo: master | comum)
  │     └── agencia (tipo: comum, filha de master)
  │           └── associado
  │                 ├── conta  ◄──── movimentacao_conta (ledger)
  │                 ├── usuario (até 4 operadores)
  │                 ├── oferta
  │                 └── transacao (como comprador ou vendedor)
  │
  ├── plano
  ├── categoria (hierárquica)
  ├── transacao
  │     └── voucher
  └── usuario (superadmin)
```

---

## 2. Prisma Schema Completo

> Este bloco é mantido em sincronia com `api/prisma/schema.prisma` — em caso de divergência futura, o arquivo real é a fonte da verdade.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

enum TipoAgencia {
  master
  comum
}

enum RoleUsuario {
  superadmin
  agency_admin
  agency_operator
  gerente
  associate_admin
  associate_operator
}

enum EntityType {
  matriz
  agencia
  associado
}

enum StatusGeral {
  ativo
  inativo
  suspenso
}

enum StatusLoja {
  aberta
  fechada
  pausada
}

enum StatusOferta {
  aberta
  fechada
  pausada
}

enum TipoAtendimento {
  presencial
  online
  voucher
}

enum TipoTransacao {
  permuta
  negociada
  transferencia
  credito
  estorno
}

enum StatusEstorno {
  em_analise
  encaminhado
  aprovado
  negado
}

enum TipoMovimentacao {
  credito
  debito
}

enum StatusTransacao {
  pendente
  concluida
  estornada
  falha
}

enum TipoPlano {
  agencia
  associado
  gerente
}

enum StatusCredito {
  em_analise
  encaminhado
  aprovado
  negado
}

enum TipoComissaoGerente {
  inscricao
  transacao
}

enum TipoOperacao {
  compra
  venda
  compra_venda
}

// ─────────────────────────────────────────
// PLANO
// ─────────────────────────────────────────

model Plano {
  id                    String        @id @default(uuid())
  nome                  String
  tipoPlano             TipoPlano     @default(associado)
  limiteRT              Decimal       @db.Decimal(15, 2)
  percentualComissao    Decimal       @db.Decimal(5, 2)
  taxaInscricao         Decimal       @default(0) @db.Decimal(15, 2)
  taxaManutencaoAnual   Decimal       @default(0) @db.Decimal(15, 2)
  ativo                 Boolean       @default(true)
  criadoEm              DateTime      @default(now())
  atualizadoEm          DateTime      @updatedAt

  associados Associado[]
  agencias   Agencia[]

  @@unique([nome, tipoPlano])
  @@index([tipoPlano])
  @@map("plano")
}

// ─────────────────────────────────────────
// AGÊNCIA
// ─────────────────────────────────────────

model Agencia {
  id               String      @id @default(uuid())
  nome             String
  nomeFantasia     String?
  cnpj             String      @unique
  inscEstadual     String?
  inscMunicipal    String?
  tipo             TipoAgencia
  email            String      @unique
  telefone         String?
  imagemUrl        String?
  status           StatusGeral @default(ativo)
  agenciaParenteId String?
  planoId          String?
  criadoEm         DateTime    @default(now())
  atualizadoEm     DateTime    @updatedAt

  logradouro  String?
  numero      String?
  complemento String?
  bairro      String?
  cidade      String
  estado      String  @db.Char(2)
  cep         String?
  regiao      String?

  limiteCredito       Decimal? @db.Decimal(15, 2) // teto de saldo negativo da conta da agência (mesma lógica de Associado.limiteCredito)
  limiteVendaMensal   Decimal? @db.Decimal(15, 2)
  limiteVendaTotal    Decimal? @db.Decimal(15, 2)
  taxaRepasseMatriz   Decimal? @db.Decimal(5, 2)
  diaVencimentoFatura Int?

  agenciaParente Agencia?         @relation("AgenciaHierarquia", fields: [agenciaParenteId], references: [id])
  agenciasFilhas Agencia[]        @relation("AgenciaHierarquia")
  plano          Plano?           @relation(fields: [planoId], references: [id])
  contatos       ContatoAgencia[]
  associados     Associado[]
  usuarios       Usuario[]
  conta          Conta?
  cobrancas      Cobranca[]

  @@map("agencia")
}

model ContatoAgencia {
  id              String   @id @default(uuid())
  agenciaId       String
  nomeContato     String?
  celular         String?
  emailSecundario String?
  criadoEm        DateTime @default(now())
  atualizadoEm    DateTime @updatedAt

  agencia Agencia @relation(fields: [agenciaId], references: [id])

  @@map("contato_agencia")
}

// ─────────────────────────────────────────
// ASSOCIADO
// ─────────────────────────────────────────

model Associado {
  id              String            @id @default(uuid())
  nome            String
  nomeFantasia    String?
  cnpj            String            @unique
  email           String            @unique
  telefone        String?
  descricao       String?
  inscEstadual    String?
  inscMunicipal   String?
  restricao       String?
  imagemUrl       String?
  mostrarNoSite   Boolean           @default(true)
  aceitaOrcamento Boolean           @default(true)
  status          StatusGeral       @default(ativo)
  statusLoja      StatusLoja        @default(aberta)
  tipoAtendimento TipoAtendimento[]
  tipoOperacao    TipoOperacao?
  categoriaId     String?
  agenciaId       String?
  planoId         String
  gerenteId       String? // gerente que cadastrou — vínculo permanente (opcional: gerentes não têm gerente acima)
  formaPagamento      Int?
  diaVencimentoFatura Int?
  valorInscricaoBRL   Decimal?      @db.Decimal(15, 2)
  valorInscricaoRT    Decimal?      @db.Decimal(15, 2)
  limiteCredito       Decimal?      @db.Decimal(15, 2) // teto de saldo negativo — validado em app (limites.ts), não há mais CHECK de banco
  limiteVendaMensal Decimal?        @db.Decimal(15, 2) // teto de volume debitado no mês corrente — substitui plano.limiteRT nas validações
  limiteVendaTotal  Decimal?        @db.Decimal(15, 2) // teto de volume debitado histórico total — substitui plano.limiteRT nas validações
  criadoEm       DateTime          @default(now())
  atualizadoEm   DateTime          @updatedAt

  logradouro  String?
  numero      String?
  complemento String?
  bairro      String?
  cidade      String
  estado      String  @db.Char(2)
  cep         String?
  regiao      String?

  agencia             Agencia?             @relation(fields: [agenciaId], references: [id])
  plano               Plano                @relation(fields: [planoId], references: [id])
  gerente             Usuario?             @relation("GerenteAssociados", fields: [gerenteId], references: [id])
  categoria           Categoria?           @relation(fields: [categoriaId], references: [id])
  conta               Conta?
  contatos            ContatoAssociado[]
  usuarios            Usuario[]
  ofertas             Oferta[]
  transacoesCompra    Transacao[]          @relation("Comprador")
  transacoesVenda     Transacao[]          @relation("Vendedor")
  solicitacoesCredito SolicitacaoCredito[]
  cobrancas           Cobranca[]

  @@map("associado")
}

model ContatoAssociado {
  id              String   @id @default(uuid())
  associadoId     String
  nomeContato     String?
  celular         String?
  emailContato    String?
  emailSecundario String?
  site            String?
  criadoEm        DateTime @default(now())
  atualizadoEm    DateTime @updatedAt

  associado Associado @relation(fields: [associadoId], references: [id])

  @@map("contato_associado")
}

// ─────────────────────────────────────────
// CONTA RT
// ─────────────────────────────────────────

model Conta {
  id            String     @id @default(uuid())
  numero        String     @unique
  saldo         Decimal    @default(0) @db.Decimal(15, 2)
  limiteCredito Decimal    @default(0) @db.Decimal(15, 2)
  entityType    EntityType
  ativo         Boolean    @default(true)
  criadoEm      DateTime   @default(now())
  atualizadoEm  DateTime   @updatedAt

  associadoId String? @unique
  agenciaId   String? @unique

  associado Associado? @relation(fields: [associadoId], references: [id])
  agencia   Agencia?   @relation(fields: [agenciaId], references: [id])

  movimentacoes     MovimentacaoConta[]
  transacoesOrigem  Transacao[]         @relation("ContaOrigem")
  transacoesDestino Transacao[]         @relation("ContaDestino")
  cobrancas         Cobranca[]
  ofertas           Oferta[]

  @@index([numero])
  @@map("conta")
}

// ─────────────────────────────────────────
// MOVIMENTAÇÃO (Ledger imutável)
// ─────────────────────────────────────────

model MovimentacaoConta {
  id            String           @id @default(uuid())
  contaId       String
  tipo          TipoMovimentacao
  valor         Decimal          @db.Decimal(15, 2)
  saldoApos     Decimal          @db.Decimal(15, 2)
  descricao     String?
  transacaoId   String?
  numeroParcela Int?
  totalParcelas Int?
  vencimento    DateTime?
  criadoEm      DateTime         @default(now())

  conta     Conta      @relation(fields: [contaId], references: [id])
  transacao Transacao? @relation(fields: [transacaoId], references: [id])

  // IMUTÁVEL: nunca atualizar ou deletar registros desta tabela
  @@index([contaId, criadoEm])
  @@map("movimentacao_conta")
}

// ─────────────────────────────────────────
// USUÁRIO
// ─────────────────────────────────────────

model Usuario {
  id                 String      @id @default(uuid())
  nome               String
  email              String      @unique
  senhaHash          String
  role               RoleUsuario
  ativo              Boolean     @default(true)
  codigoOperador     String?     @unique
  cpf                String?     @unique
  entityType         EntityType
  associadoId        String?
  agenciaId          String?
  tentativasLogin    Int         @default(0)
  bloqueadoAte       DateTime?
  criadoEm           DateTime    @default(now())
  atualizadoEm       DateTime    @updatedAt
  percentualComissao Decimal?    @db.Decimal(5, 2) // apenas para role = gerente

  associado             Associado?        @relation(fields: [associadoId], references: [id])
  agencia               Agencia?          @relation(fields: [agenciaId], references: [id])
  refreshTokens         RefreshToken[]
  transacoesIniciadas   Transacao[]       @relation("UsuarioIniciador")
  associadosGerenciados Associado[]       @relation("GerenteAssociados")
  comissoesGerente      ComissaoGerente[]

  @@index([email])
  @@map("usuario")
}

// ─────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  usuarioId String
  expiresAt DateTime
  revogado  Boolean  @default(false)
  criadoEm  DateTime @default(now())

  usuario Usuario @relation(fields: [usuarioId], references: [id])

  @@index([token])
  @@index([usuarioId])
  @@map("refresh_token")
}

// ─────────────────────────────────────────
// COMISSÃO DO GERENTE (imutável)
// ─────────────────────────────────────────

model ComissaoGerente {
  id           String              @id @default(uuid())
  gerenteId    String
  associadoId  String
  transacaoId  String?             // opcional: comissão de inscrição não tem transação
  tipoComissao TipoComissaoGerente @default(transacao)
  baseValorRT  Decimal             @db.Decimal(15, 2)
  percentual   Decimal             @db.Decimal(5, 2)
  comissaoBRL  Decimal             @default(0) @db.Decimal(15, 2)
  comissaoRT   Decimal             @db.Decimal(15, 2)
  criadoEm     DateTime            @default(now())

  gerente   Usuario    @relation(fields: [gerenteId], references: [id])
  associado Associado  @relation(fields: [associadoId], references: [id])
  transacao Transacao? @relation(fields: [transacaoId], references: [id])

  @@index([gerenteId, criadoEm])
  @@index([transacaoId])
  @@map("comissao_gerente")
}

// ─────────────────────────────────────────
// CATEGORIA
// ─────────────────────────────────────────

model Categoria {
  id                 String    @id @default(uuid())
  nome               String
  ativo              Boolean   @default(true)
  categoriaParenteId String?
  nivel              Int       @default(1)
  criadoEm           DateTime  @default(now())
  atualizadoEm       DateTime  @updatedAt

  categoriaParente Categoria?  @relation("CategoriaHierarquia", fields: [categoriaParenteId], references: [id])
  categoriasFilhas Categoria[] @relation("CategoriaHierarquia")
  ofertas          Oferta[]
  associados       Associado[]

  @@unique([nome, categoriaParenteId])
  @@map("categoria")
}

// ─────────────────────────────────────────
// OFERTA DE PERMUTA
// ─────────────────────────────────────────

model Oferta {
  id                   String            @id @default(uuid())
  titulo               String
  descricao            String
  valorRT              Decimal           @db.Decimal(15, 2)
  quantidadeDisponivel Int
  quantidadeTotal      Int
  status               StatusOferta      @default(aberta)
  tipoAtendimento      TipoAtendimento[]
  categoriaId          String
  associadoId          String?
  contaId              String
  cidade               String
  estado               String            @db.Char(2)
  imagemUrl            String?
  vencimento           DateTime?
  criadoEm             DateTime          @default(now())
  atualizadoEm         DateTime          @updatedAt

  categoria  Categoria   @relation(fields: [categoriaId], references: [id])
  associado  Associado?  @relation(fields: [associadoId], references: [id])
  conta      Conta       @relation(fields: [contaId], references: [id])
  transacoes Transacao[]

  @@index([status, cidade, estado])
  @@index([categoriaId])
  @@index([associadoId])
  @@index([contaId])
  @@map("oferta")
}

// ─────────────────────────────────────────
// TRANSAÇÃO
// ─────────────────────────────────────────

model Transacao {
  id                  String          @id @default(uuid())
  tipo                TipoTransacao
  status              StatusTransacao @default(pendente)
  valorRT             Decimal         @db.Decimal(15, 2)
  comissaoBRL         Decimal?        @db.Decimal(15, 2)
  descricao           String?
  parcelas            Int             @default(1)
  quantidade          Int?            // unidades da oferta compradas (apenas tipo: permuta) — usado para restaurar estoque no estorno
  compradorId         String?
  vendedorId          String?
  contaOrigemId       String?
  contaDestinoId      String?
  usuarioIniciadorId  String?
  ofertaId            String?
  transacaoOriginalId String?
  notaAtendimento     Int?            // avaliação do vendedor pelo comprador (1-5), apenas tipo: permuta | negociada
  comentarioAvaliacao String?
  criadoEm            DateTime        @default(now())
  atualizadoEm        DateTime        @updatedAt

  comprador         Associado?  @relation("Comprador", fields: [compradorId], references: [id])
  vendedor          Associado?  @relation("Vendedor", fields: [vendedorId], references: [id])
  contaOrigem       Conta?      @relation("ContaOrigem", fields: [contaOrigemId], references: [id])
  contaDestino      Conta?      @relation("ContaDestino", fields: [contaDestinoId], references: [id])
  usuarioIniciador  Usuario?    @relation("UsuarioIniciador", fields: [usuarioIniciadorId], references: [id])
  oferta            Oferta?     @relation(fields: [ofertaId], references: [id])
  transacaoOriginal Transacao?  @relation("Estorno", fields: [transacaoOriginalId], references: [id])
  estornos          Transacao[] @relation("Estorno")

  movimentacoes       MovimentacaoConta[]
  voucher             Voucher?
  comissoesGerente    ComissaoGerente[]
  solicitacoesEstorno SolicitacaoEstorno[]

  @@index([compradorId, criadoEm])
  @@index([vendedorId, criadoEm])
  @@index([status])
  @@map("transacao")
}

// ─────────────────────────────────────────
// SOLICITAÇÃO DE ESTORNO (fluxo de aprovação, mesmo padrão de SolicitacaoCredito)
// ─────────────────────────────────────────

model SolicitacaoEstorno {
  id            String        @id @default(uuid())
  transacaoId   String
  solicitanteId String
  motivo        String?
  status        StatusEstorno @default(em_analise)
  criadoEm      DateTime      @default(now())
  atualizadoEm  DateTime      @updatedAt

  transacao   Transacao @relation(fields: [transacaoId], references: [id])
  solicitante Usuario   @relation(fields: [solicitanteId], references: [id])

  @@index([transacaoId])
  @@index([status])
  @@map("solicitacao_estorno")
}

// ─────────────────────────────────────────
// VOUCHER
// ─────────────────────────────────────────

model Voucher {
  id          String   @id @default(uuid())
  codigo      String   @unique @default(uuid())
  transacaoId String   @unique
  pdfUrl      String?
  emitidoEm   DateTime @default(now())

  transacao Transacao @relation(fields: [transacaoId], references: [id])

  @@map("voucher")
}

// ─────────────────────────────────────────
// SOLICITAÇÃO DE CRÉDITO RT
// ─────────────────────────────────────────

model SolicitacaoCredito {
  id              String        @id @default(uuid())
  associadoId     String
  valorSolicitado Decimal       @db.Decimal(15, 2)
  descricao       String?
  status          StatusCredito @default(em_analise)
  criadoEm        DateTime      @default(now())
  atualizadoEm    DateTime      @updatedAt

  associado Associado @relation(fields: [associadoId], references: [id])

  @@index([associadoId, criadoEm])
  @@index([status])
  @@map("solicitacao_credito")
}

// ─────────────────────────────────────────
// COBRANÇA / FATURA BRL
// ─────────────────────────────────────────

model Cobranca {
  id           String   @id @default(uuid())
  descricao    String?
  valorBRL     Decimal? @db.Decimal(15, 2) // preenchido quando a cobrança é em moeda real
  valorRT      Decimal? @db.Decimal(15, 2) // preenchido quando a cobrança é em RT (não debita a conta — saldo nunca fica negativo)
  vencimento   DateTime
  pago         Boolean  @default(false)
  tipo         TipoCobranca @default(outro) // inscricao | manutencao | comissao | outro
  contaId      String
  associadoId  String?
  agenciaId    String?
  transacaoId  String?
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  conta     Conta      @relation(fields: [contaId], references: [id])
  associado Associado? @relation(fields: [associadoId], references: [id])
  agencia   Agencia?   @relation(fields: [agenciaId], references: [id])

  @@index([contaId, pago])
  @@index([vencimento])
  @@map("cobranca")
}

// ─────────────────────────────────────────
// ARQUIVO (Backblaze B2)
// ─────────────────────────────────────────

model Arquivo {
  id       String  @id @default(uuid())
  nome     String
  url      String
  tamanho  Int?
  mimeType String?
  bucket   String  @default("redetrade")
  criadoEm DateTime @default(now())

  @@map("arquivo")
}
```

---

## 3. Índices

Já aplicados nos modelos do schema acima (via `@@index`):

| Modelo | Índice | Motivo |
|---|---|---|
| `Conta` | `[numero]` | busca por número |
| `MovimentacaoConta` | `[contaId, criadoEm]` | extrato por conta e data |
| `Transacao` | `[compradorId, criadoEm]`, `[vendedorId, criadoEm]`, `[status]` | listagem por comprador/vendedor e data |
| `Oferta` | `[status, cidade, estado]`, `[categoriaId]`, `[associadoId]` | busca pública |
| `Usuario` | `[email]` | login |
| `RefreshToken` | `[token]`, `[usuarioId]` | lookup por token |
| `ComissaoGerente` | `[gerenteId, criadoEm]`, `[transacaoId]` | extrato de comissões |
| `Plano` | `[tipoPlano]` | filtro por tipo |
| `SolicitacaoCredito` | `[associadoId, criadoEm]`, `[status]` | fluxo de créditos |
| `Cobranca` | `[contaId, pago]`, `[vencimento]` | cobranças pendentes |

---

## 4. Regras de Integridade no Banco

> **`saldo_nao_negativo` foi removida** (migration `20260813015241_remove_saldo_nao_negativo_constraint`). Um `CHECK (saldo >= 0)` único no banco não consegue expressar um teto de saldo negativo *por associado* — cada `Associado` (e cada `Agencia`) tem seu próprio `limiteCredito`. A validação passou a ser 100% de aplicação: `saldoSuficienteParaDebito()`/`getLimiteCreditoDaConta()`/`validarLimiteVenda()` em `api/src/shared/utils/limites.ts`, chamadas em toda operação de débito (permuta, negociada, transferência, quitação de cobrança RT). `limiteVendaMensal`/`limiteVendaTotal` do `Associado` substituem `plano.limiteRT` como teto de volume nessas mesmas validações — `plano.limiteRT` continua no schema, mas só como valor de referência no cadastro.

Aplicadas via `$executeRaw` idempotente no `seed.ts` (débito técnico conhecido — deveriam estar em migration):

```sql
-- Valor de oferta maior que zero
ALTER TABLE oferta ADD CONSTRAINT valor_rt_positivo CHECK ("valorRT" > 0);

-- Quantidade nunca negativa
ALTER TABLE oferta ADD CONSTRAINT quantidade_nao_negativa CHECK ("quantidadeDisponivel" >= 0);

-- Valor de transação positivo
ALTER TABLE transacao ADD CONSTRAINT valor_transacao_positivo CHECK ("valorRT" > 0);

-- Parcelas entre 1 e 12
ALTER TABLE transacao ADD CONSTRAINT parcelas_validas CHECK (parcelas >= 1 AND parcelas <= 12);

-- Nível de categoria máximo 3
ALTER TABLE categoria ADD CONSTRAINT nivel_maximo CHECK (nivel <= 3);
```

Aplicadas via migration (`20260703012446_comissao_cobranca_e_integridade`):

```sql
-- Cobrança precisa ter valor em BRL ou RT (nunca os dois nulos)
ALTER TABLE cobranca ADD CONSTRAINT cobranca_valor_definido CHECK ("valorBRL" IS NOT NULL OR "valorRT" IS NOT NULL);

-- Nota de atendimento sempre entre 1 e 5, quando preenchida
ALTER TABLE transacao ADD CONSTRAINT nota_atendimento_valida CHECK ("notaAtendimento" IS NULL OR ("notaAtendimento" BETWEEN 1 AND 5));
```

---

## 5. Seed Inicial

O seed (`prisma/seed.ts`) deve criar:

1. **Superadmin da Matriz**
   - email: `admin@redetrade.com.br`
   - senha: via env `SEED_ADMIN_PASSWORD`
   - role: `superadmin`

2. **Planos padrão** (`tipoPlano: associado`)
   - Plano Básico: 5.000 RT, 5% comissão
   - Plano Intermediário: 15.000 RT, 4% comissão
   - Plano Avançado: 50.000 RT, 3% comissão

3. **Categorias iniciais**
   - Alimentação
     - Restaurantes
     - Padarias
   - Serviços
     - Saúde
     - Educação
     - Beleza
   - Produtos
     - Eletrônicos
     - Vestuário

---

## 6. Observações Importantes

| Regra | Implementação |
|---|---|
| Ledger imutável | `movimentacao_conta` nunca recebe UPDATE ou DELETE. Apenas INSERT. |
| Comissão gerente imutável | `comissao_gerente` nunca recebe UPDATE ou DELETE. Apenas INSERT via job assíncrono. |
| Saldo desnormalizado | `conta.saldo` é atualizado via `prisma.$transaction` junto com a movimentação. Nunca recalcular via SUM em produção. |
| Conta auto-criada | Ao criar Agência ou Associado, criar `Conta` automaticamente no mesmo service (não em hook/trigger). |
| Vínculo gerente permanente | `associado.gerenteId` nunca deve ser atualizado após o cadastro. |
| Código operador | Gerado sequencialmente: pegar o maior número existente para o associado e incrementar. Ex: se existem 02 operadores, o próximo é 03. |
| Número de conta | Sequencial global com 7 dígitos. Usar sequence do PostgreSQL: `CREATE SEQUENCE conta_numero_seq START 1`. |
| Limite do plano | Verificar via SUM das `movimentacao_conta` de débito do mês corrente para o `associadoId`. |
| Comissão do gerente | Calculada no job `commission.gerente` após `transacao.status = concluida`. Fórmula: `comissaoGerenteBRL = comissaoPlataformaBRL * (percentualGerente / 100)`. Registro apenas financeiro/relatório — sem fluxo de saque automatizado (MVP). |
| Comissão da plataforma | `transacao.comissaoBRL` é calculado na criação, mas só vira dívida cobrável quando o job `commission.calculate` cria a `Cobranca` (BRL) vinculada via `transacaoId`, cobrada do comprador. |
| Cobrança em RT — quitação | `PATCH /cobrancas/:id/quitar` move o RT de verdade quando `valorRT` está preenchido (debita o devedor, credita `agenciaId` se houver, atômico). Diferente de cobrança em BRL, que é liquidada fora do sistema — `quitar` só reconcilia manualmente. |
