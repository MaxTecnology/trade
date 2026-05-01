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

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
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
  transferencia
  credito
  estorno
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

enum Periodicidade {
  mensal
  anual
}

// ─────────────────────────────────────────
// PLANO
// ─────────────────────────────────────────

model Plano {
  id                  String        @id @default(uuid())
  nome                String        @unique
  limiteRT            Decimal       @db.Decimal(15, 2)
  percentualComissao  Decimal       @db.Decimal(5, 2)
  periodicidade       Periodicidade
  maxParcelas         Int           @default(1)
  ativo               Boolean       @default(true)
  criadoEm            DateTime      @default(now())
  atualizadoEm        DateTime      @updatedAt

  associados          Associado[]

  @@map("plano")
}

// ─────────────────────────────────────────
// AGÊNCIA
// ─────────────────────────────────────────

model Agencia {
  id              String       @id @default(uuid())
  nome            String
  cnpj            String       @unique
  tipo            TipoAgencia
  email           String       @unique
  telefone        String?
  status          StatusGeral  @default(ativo)
  agenciaParenteId String?
  criadoEm        DateTime     @default(now())
  atualizadoEm    DateTime     @updatedAt

  // Endereço inline (sem tabela separada para simplicidade)
  logradouro      String?
  cidade          String
  estado          String       @db.Char(2)
  cep             String?

  agenciaParente  Agencia?     @relation("AgenciaHierarquia", fields: [agenciaParenteId], references: [id])
  agenciasFilhas  Agencia[]    @relation("AgenciaHierarquia")
  associados      Associado[]
  usuarios        Usuario[]
  conta           Conta?

  @@map("agencia")
}

// ─────────────────────────────────────────
// ASSOCIADO
// ─────────────────────────────────────────

model Associado {
  id                String            @id @default(uuid())
  nome              String
  cnpj              String            @unique
  email             String            @unique
  telefone          String?
  status            StatusGeral       @default(ativo)
  statusLoja        StatusLoja        @default(aberta)
  tipoAtendimento   TipoAtendimento[]
  agenciaId         String
  planoId           String
  gerenteId         String   // gerente que cadastrou — vínculo permanente
  criadoEm          DateTime          @default(now())
  atualizadoEm      DateTime          @updatedAt

  // Endereço inline
  logradouro        String?
  cidade            String
  estado            String            @db.Char(2)
  cep               String?

  agencia           Agencia           @relation(fields: [agenciaId], references: [id])
  plano             Plano             @relation(fields: [planoId], references: [id])
  gerente           Usuario           @relation("GerenteAssociados", fields: [gerenteId], references: [id])
  conta             Conta?
  usuarios          Usuario[]
  ofertas           Oferta[]
  transacoesCompra  Transacao[]       @relation("Comprador")
  transacoesVenda   Transacao[]       @relation("Vendedor")

  @@map("associado")
}

// ─────────────────────────────────────────
// CONTA RT (uma por Agência ou Associado)
// ─────────────────────────────────────────

model Conta {
  id              String      @id @default(uuid())
  numero          String      @unique  // 7 dígitos: "0000001"
  saldo           Decimal     @default(0) @db.Decimal(15, 2)
  entityType      EntityType
  ativo           Boolean     @default(true)
  criadoEm        DateTime    @default(now())
  atualizadoEm    DateTime    @updatedAt

  // Relação polimórfica — apenas um será preenchido
  associadoId     String?     @unique
  agenciaId       String?     @unique

  associado       Associado?  @relation(fields: [associadoId], references: [id])
  agencia         Agencia?    @relation(fields: [agenciaId], references: [id])

  movimentacoes   MovimentacaoConta[]

  // Conta origem em transferências
  transacoesOrigem  Transacao[] @relation("ContaOrigem")
  // Conta destino em transferências/créditos
  transacoesDestino Transacao[] @relation("ContaDestino")

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
  // Para parcelamento: qual parcela é esta
  numeroParcela Int?
  totalParcelas Int?
  // Data de vencimento (parcelamento)
  vencimento    DateTime?
  criadoEm      DateTime         @default(now())

  conta         Conta            @relation(fields: [contaId], references: [id])
  transacao     Transacao?       @relation(fields: [transacaoId], references: [id])

  // IMUTÁVEL: nunca atualizar ou deletar registros desta tabela
  @@map("movimentacao_conta")
}

// ─────────────────────────────────────────
// USUÁRIO
// ─────────────────────────────────────────

model Usuario {
  id                String      @id @default(uuid())
  nome              String
  email             String      @unique
  senhaHash         String
  role              RoleUsuario
  ativo             Boolean     @default(true)
  // Identificador de operador (ex: "0000001-01") — apenas para associate_operator
  codigoOperador    String?     @unique
  entityType        EntityType
  // Apenas um será preenchido
  associadoId       String?
  agenciaId         String?
  // Controle de tentativas de login
  tentativasLogin   Int         @default(0)
  bloqueadoAte      DateTime?
  criadoEm          DateTime    @default(now())
  atualizadoEm      DateTime    @updatedAt

  // Apenas para role = gerente
  percentualComissao Decimal?   @db.Decimal(5, 2)

  associado         Associado?  @relation(fields: [associadoId], references: [id])
  agencia           Agencia?    @relation(fields: [agenciaId], references: [id])
  refreshTokens     RefreshToken[]
  transacoesIniciadas Transacao[] @relation("UsuarioIniciador")
  // Associados que este gerente cadastrou
  associadosGerenciados Associado[] @relation("GerenteAssociados")
  comissoesGerente  ComissaoGerente[]

  @@map("usuario")
}

// ─────────────────────────────────────────
// COMISSÃO DO GERENTE
// ─────────────────────────────────────────

model ComissaoGerente {
  id                    String    @id @default(uuid())
  gerenteId             String
  associadoId           String
  transacaoId           String
  valorTransacaoRT      Decimal   @db.Decimal(15, 2)
  comissaoPlataformaBRL Decimal   @db.Decimal(15, 2)
  percentualGerente     Decimal   @db.Decimal(5, 2)
  comissaoGerenteBRL    Decimal   @db.Decimal(15, 2)
  criadoEm             DateTime  @default(now())

  gerente     Usuario   @relation(fields: [gerenteId], references: [id])
  transacao   Transacao @relation(fields: [transacaoId], references: [id])

  // IMUTÁVEL: apenas INSERT, nunca UPDATE ou DELETE
  @@index([gerenteId, criadoEm])
  @@index([transacaoId])
  @@map("comissao_gerente")

// ─────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────

model RefreshToken {
  id          String    @id @default(uuid())
  token       String    @unique
  usuarioId   String
  expiresAt   DateTime
  revogado    Boolean   @default(false)
  criadoEm    DateTime  @default(now())

  usuario     Usuario   @relation(fields: [usuarioId], references: [id])

  @@map("refresh_token")
}

// ─────────────────────────────────────────
// CATEGORIA
// ─────────────────────────────────────────

model Categoria {
  id                  String      @id @default(uuid())
  nome                String
  ativo               Boolean     @default(true)
  categoriaParenteId  String?
  nivel               Int         @default(1)  // 1, 2 ou 3
  criadoEm            DateTime    @default(now())
  atualizadoEm        DateTime    @updatedAt

  categoriaParente    Categoria?  @relation("CategoriaHierarquia", fields: [categoriaParenteId], references: [id])
  categoriasFilhas    Categoria[] @relation("CategoriaHierarquia")
  ofertas             Oferta[]

  // Nome único dentro do mesmo pai
  @@unique([nome, categoriaParenteId])
  @@map("categoria")
}

// ─────────────────────────────────────────
// OFERTA DE PERMUTA
// ─────────────────────────────────────────

model Oferta {
  id                    String          @id @default(uuid())
  titulo                String
  descricao             String
  valorRT               Decimal         @db.Decimal(15, 2)
  quantidadeDisponivel  Int
  quantidadeTotal       Int
  status                StatusOferta    @default(aberta)
  tipoAtendimento       TipoAtendimento[]
  categoriaId           String
  associadoId           String
  cidade                String
  estado                String          @db.Char(2)
  criadoEm              DateTime        @default(now())
  atualizadoEm          DateTime        @updatedAt

  categoria             Categoria       @relation(fields: [categoriaId], references: [id])
  associado             Associado       @relation(fields: [associadoId], references: [id])
  transacoes            Transacao[]

  @@map("oferta")
}

// ─────────────────────────────────────────
// TRANSAÇÃO
// ─────────────────────────────────────────

model Transacao {
  id                String          @id @default(uuid())
  tipo              TipoTransacao
  status            StatusTransacao @default(pendente)
  valorRT           Decimal         @db.Decimal(15, 2)
  comissaoBRL       Decimal?        @db.Decimal(15, 2)
  descricao         String?
  parcelas          Int             @default(1)

  // Partes envolvidas
  compradorId       String?         // Associado comprador (permuta)
  vendedorId        String?         // Associado vendedor (permuta)
  contaOrigemId     String?         // Conta débito (transferência/crédito)
  contaDestinoId    String?         // Conta crédito
  usuarioIniciadorId String?

  // Oferta (apenas em permuta)
  ofertaId          String?

  // Estorno: referência à transação original
  transacaoOriginalId String?

  criadoEm          DateTime        @default(now())
  atualizadoEm      DateTime        @updatedAt

  comprador         Associado?      @relation("Comprador", fields: [compradorId], references: [id])
  vendedor          Associado?      @relation("Vendedor", fields: [vendedorId], references: [id])
  contaOrigem       Conta?          @relation("ContaOrigem", fields: [contaOrigemId], references: [id])
  contaDestino      Conta?          @relation("ContaDestino", fields: [contaDestinoId], references: [id])
  usuarioIniciador  Usuario?        @relation("UsuarioIniciador", fields: [usuarioIniciadorId], references: [id])
  oferta            Oferta?         @relation(fields: [ofertaId], references: [id])
  transacaoOriginal Transacao?      @relation("Estorno", fields: [transacaoOriginalId], references: [id])
  estornos          Transacao[]     @relation("Estorno")

  movimentacoes     MovimentacaoConta[]
  voucher           Voucher?
  comissoesGerente  ComissaoGerente[]

  @@map("transacao")
}

// ─────────────────────────────────────────
// VOUCHER
// ─────────────────────────────────────────

model Voucher {
  id            String    @id @default(uuid())
  codigo        String    @unique @default(uuid())
  transacaoId   String    @unique
  pdfUrl        String?
  emitidoEm     DateTime  @default(now())

  transacao     Transacao @relation(fields: [transacaoId], references: [id])

  @@map("voucher")
}
```

---

## 3. Índices Recomendados

Adicionar ao schema após os modelos (como `@@index`):

```prisma
// Conta: busca por número
@@index([numero])

// MovimentacaoConta: extrato por conta e data
@@index([contaId, criadoEm])

// Transacao: listagem por comprador/vendedor e data
@@index([compradorId, criadoEm])
@@index([vendedorId, criadoEm])
@@index([status])

// Oferta: busca pública
@@index([status, cidade, estado])
@@index([categoriaId])
@@index([associadoId])

// Usuario: login
@@index([email])

// RefreshToken: lookup por token
@@index([token])
@@index([usuarioId])
```

---

## 4. Regras de Integridade no Banco

```sql
-- Saldo nunca negativo
ALTER TABLE conta ADD CONSTRAINT saldo_nao_negativo CHECK (saldo >= 0);

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

---

## 5. Seed Inicial

O seed (`prisma/seed.ts`) deve criar:

1. **Superadmin da Matriz**
   - email: `admin@redetrade.com.br`
   - senha: via env `SEED_ADMIN_PASSWORD`
   - role: `superadmin`

2. **Planos padrão**
   - Plano Básico: 5.000 RT/mês, 5% comissão, 1 parcela
   - Plano Intermediário: 15.000 RT/mês, 4% comissão, 3 parcelas
   - Plano Avançado: 50.000 RT/mês, 3% comissão, 6 parcelas

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
| Comissão do gerente | Calculada no job `commission.gerente` após `transacao.status = concluida`. Fórmula: `comissaoGerenteBRL = comissaoPlataformaBRL * (percentualGerente / 100)`. |
