-- CreateEnum
CREATE TYPE "TipoAgencia" AS ENUM ('master', 'comum');

-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('superadmin', 'agency_admin', 'agency_operator', 'gerente', 'associate_admin', 'associate_operator');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('matriz', 'agencia', 'associado');

-- CreateEnum
CREATE TYPE "StatusGeral" AS ENUM ('ativo', 'inativo', 'suspenso');

-- CreateEnum
CREATE TYPE "StatusLoja" AS ENUM ('aberta', 'fechada', 'pausada');

-- CreateEnum
CREATE TYPE "StatusOferta" AS ENUM ('aberta', 'fechada', 'pausada');

-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('presencial', 'online', 'voucher');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('permuta', 'transferencia', 'credito', 'estorno');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('credito', 'debito');

-- CreateEnum
CREATE TYPE "StatusTransacao" AS ENUM ('pendente', 'concluida', 'estornada', 'falha');

-- CreateEnum
CREATE TYPE "TipoPlano" AS ENUM ('agencia', 'associado', 'gerente');

-- CreateEnum
CREATE TYPE "StatusCredito" AS ENUM ('em_analise', 'encaminhado', 'aprovado', 'negado');

-- CreateEnum
CREATE TYPE "TipoComissaoGerente" AS ENUM ('inscricao', 'transacao');

-- CreateEnum
CREATE TYPE "TipoOperacao" AS ENUM ('compra', 'venda', 'compra_venda');

-- CreateTable
CREATE TABLE "plano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoPlano" "TipoPlano" NOT NULL DEFAULT 'associado',
    "limiteRT" DECIMAL(15,2) NOT NULL,
    "percentualComissao" DECIMAL(5,2) NOT NULL,
    "taxaInscricaoRT" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxaManutencaoAnualRT" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencia" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "inscEstadual" TEXT,
    "inscMunicipal" TEXT,
    "tipo" "TipoAgencia" NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "imagemUrl" TEXT,
    "status" "StatusGeral" NOT NULL DEFAULT 'ativo',
    "agenciaParenteId" TEXT,
    "planoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" TEXT,
    "regiao" TEXT,
    "limiteCredito" DECIMAL(15,2),
    "limiteVendaMensal" DECIMAL(15,2),
    "limiteVendaTotal" DECIMAL(15,2),
    "taxaRepasseMatriz" DECIMAL(5,2),
    "diaVencimentoFatura" INTEGER,

    CONSTRAINT "agencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contato_agencia" (
    "id" TEXT NOT NULL,
    "agenciaId" TEXT NOT NULL,
    "nomeContato" TEXT,
    "celular" TEXT,
    "emailSecundario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contato_agencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "associado" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "descricao" TEXT,
    "inscEstadual" TEXT,
    "inscMunicipal" TEXT,
    "restricao" TEXT,
    "imagemUrl" TEXT,
    "mostrarNoSite" BOOLEAN NOT NULL DEFAULT true,
    "aceitaOrcamento" BOOLEAN NOT NULL DEFAULT true,
    "status" "StatusGeral" NOT NULL DEFAULT 'ativo',
    "statusLoja" "StatusLoja" NOT NULL DEFAULT 'aberta',
    "tipoAtendimento" "TipoAtendimento"[],
    "tipoOperacao" "TipoOperacao",
    "categoriaId" TEXT,
    "agenciaId" TEXT,
    "planoId" TEXT NOT NULL,
    "gerenteId" TEXT,
    "formaPagamento" INTEGER,
    "diaVencimentoFatura" INTEGER,
    "valorInscricaoBRL" DECIMAL(15,2),
    "valorInscricaoRT" DECIMAL(15,2),
    "limiteCredito" DECIMAL(15,2),
    "limiteVendaMensal" DECIMAL(15,2),
    "limiteVendaTotal" DECIMAL(15,2),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" TEXT,
    "regiao" TEXT,

    CONSTRAINT "associado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contato_associado" (
    "id" TEXT NOT NULL,
    "associadoId" TEXT NOT NULL,
    "nomeContato" TEXT,
    "celular" TEXT,
    "emailContato" TEXT,
    "emailSecundario" TEXT,
    "site" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contato_associado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conta" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "entityType" "EntityType" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "associadoId" TEXT,
    "agenciaId" TEXT,

    CONSTRAINT "conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao_conta" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "saldoApos" DECIMAL(15,2) NOT NULL,
    "descricao" TEXT,
    "transacaoId" TEXT,
    "numeroParcela" INTEGER,
    "totalParcelas" INTEGER,
    "vencimento" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacao_conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "RoleUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "codigoOperador" TEXT,
    "cpf" TEXT,
    "entityType" "EntityType" NOT NULL,
    "associadoId" TEXT,
    "agenciaId" TEXT,
    "tentativasLogin" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoAte" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "percentualComissao" DECIMAL(5,2),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revogado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissao_gerente" (
    "id" TEXT NOT NULL,
    "gerenteId" TEXT NOT NULL,
    "associadoId" TEXT NOT NULL,
    "transacaoId" TEXT,
    "tipoComissao" "TipoComissaoGerente" NOT NULL DEFAULT 'transacao',
    "baseValorRT" DECIMAL(15,2) NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "comissaoBRL" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "comissaoRT" DECIMAL(15,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comissao_gerente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaParenteId" TEXT,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oferta" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorRT" DECIMAL(15,2) NOT NULL,
    "quantidadeDisponivel" INTEGER NOT NULL,
    "quantidadeTotal" INTEGER NOT NULL,
    "status" "StatusOferta" NOT NULL DEFAULT 'aberta',
    "tipoAtendimento" "TipoAtendimento"[],
    "categoriaId" TEXT NOT NULL,
    "associadoId" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "imagemUrl" TEXT,
    "vencimento" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oferta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacao" (
    "id" TEXT NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "status" "StatusTransacao" NOT NULL DEFAULT 'pendente',
    "valorRT" DECIMAL(15,2) NOT NULL,
    "comissaoBRL" DECIMAL(15,2),
    "descricao" TEXT,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "compradorId" TEXT,
    "vendedorId" TEXT,
    "contaOrigemId" TEXT,
    "contaDestinoId" TEXT,
    "usuarioIniciadorId" TEXT,
    "ofertaId" TEXT,
    "transacaoOriginalId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "transacaoId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacao_credito" (
    "id" TEXT NOT NULL,
    "associadoId" TEXT NOT NULL,
    "valorSolicitado" DECIMAL(15,2) NOT NULL,
    "descricao" TEXT,
    "status" "StatusCredito" NOT NULL DEFAULT 'em_analise',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacao_credito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobranca" (
    "id" TEXT NOT NULL,
    "descricao" TEXT,
    "valorBRL" DECIMAL(15,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "contaId" TEXT NOT NULL,
    "associadoId" TEXT,
    "agenciaId" TEXT,
    "transacaoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanho" INTEGER,
    "mimeType" TEXT,
    "bucket" TEXT NOT NULL DEFAULT 'redetrade',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plano_tipoPlano_idx" ON "plano"("tipoPlano");

-- CreateIndex
CREATE UNIQUE INDEX "plano_nome_tipoPlano_key" ON "plano"("nome", "tipoPlano");

-- CreateIndex
CREATE UNIQUE INDEX "agencia_cnpj_key" ON "agencia"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "agencia_email_key" ON "agencia"("email");

-- CreateIndex
CREATE UNIQUE INDEX "associado_cnpj_key" ON "associado"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "associado_email_key" ON "associado"("email");

-- CreateIndex
CREATE UNIQUE INDEX "conta_numero_key" ON "conta"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "conta_associadoId_key" ON "conta"("associadoId");

-- CreateIndex
CREATE UNIQUE INDEX "conta_agenciaId_key" ON "conta"("agenciaId");

-- CreateIndex
CREATE INDEX "conta_numero_idx" ON "conta"("numero");

-- CreateIndex
CREATE INDEX "movimentacao_conta_contaId_criadoEm_idx" ON "movimentacao_conta"("contaId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_codigoOperador_key" ON "usuario"("codigoOperador");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_cpf_key" ON "usuario"("cpf");

-- CreateIndex
CREATE INDEX "usuario_email_idx" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE INDEX "refresh_token_token_idx" ON "refresh_token"("token");

-- CreateIndex
CREATE INDEX "refresh_token_usuarioId_idx" ON "refresh_token"("usuarioId");

-- CreateIndex
CREATE INDEX "comissao_gerente_gerenteId_criadoEm_idx" ON "comissao_gerente"("gerenteId", "criadoEm");

-- CreateIndex
CREATE INDEX "comissao_gerente_transacaoId_idx" ON "comissao_gerente"("transacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nome_categoriaParenteId_key" ON "categoria"("nome", "categoriaParenteId");

-- CreateIndex
CREATE INDEX "oferta_status_cidade_estado_idx" ON "oferta"("status", "cidade", "estado");

-- CreateIndex
CREATE INDEX "oferta_categoriaId_idx" ON "oferta"("categoriaId");

-- CreateIndex
CREATE INDEX "oferta_associadoId_idx" ON "oferta"("associadoId");

-- CreateIndex
CREATE INDEX "transacao_compradorId_criadoEm_idx" ON "transacao"("compradorId", "criadoEm");

-- CreateIndex
CREATE INDEX "transacao_vendedorId_criadoEm_idx" ON "transacao"("vendedorId", "criadoEm");

-- CreateIndex
CREATE INDEX "transacao_status_idx" ON "transacao"("status");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_codigo_key" ON "voucher"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_transacaoId_key" ON "voucher"("transacaoId");

-- CreateIndex
CREATE INDEX "solicitacao_credito_associadoId_criadoEm_idx" ON "solicitacao_credito"("associadoId", "criadoEm");

-- CreateIndex
CREATE INDEX "solicitacao_credito_status_idx" ON "solicitacao_credito"("status");

-- CreateIndex
CREATE INDEX "cobranca_contaId_pago_idx" ON "cobranca"("contaId", "pago");

-- CreateIndex
CREATE INDEX "cobranca_vencimento_idx" ON "cobranca"("vencimento");

-- AddForeignKey
ALTER TABLE "agencia" ADD CONSTRAINT "agencia_agenciaParenteId_fkey" FOREIGN KEY ("agenciaParenteId") REFERENCES "agencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencia" ADD CONSTRAINT "agencia_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "plano"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contato_agencia" ADD CONSTRAINT "contato_agencia_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "associado" ADD CONSTRAINT "associado_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "associado" ADD CONSTRAINT "associado_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "associado" ADD CONSTRAINT "associado_gerenteId_fkey" FOREIGN KEY ("gerenteId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "associado" ADD CONSTRAINT "associado_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contato_associado" ADD CONSTRAINT "contato_associado_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conta" ADD CONSTRAINT "conta_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conta" ADD CONSTRAINT "conta_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_conta" ADD CONSTRAINT "movimentacao_conta_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_conta" ADD CONSTRAINT "movimentacao_conta_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao_gerente" ADD CONSTRAINT "comissao_gerente_gerenteId_fkey" FOREIGN KEY ("gerenteId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissao_gerente" ADD CONSTRAINT "comissao_gerente_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_categoriaParenteId_fkey" FOREIGN KEY ("categoriaParenteId") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta" ADD CONSTRAINT "oferta_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta" ADD CONSTRAINT "oferta_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao" ADD CONSTRAINT "transacao_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "associado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao" ADD CONSTRAINT "transacao_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "associado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao" ADD CONSTRAINT "transacao_contaOrigemId_fkey" FOREIGN KEY ("contaOrigemId") REFERENCES "conta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao" ADD CONSTRAINT "transacao_contaDestinoId_fkey" FOREIGN KEY ("contaDestinoId") REFERENCES "conta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao" ADD CONSTRAINT "transacao_usuarioIniciadorId_fkey" FOREIGN KEY ("usuarioIniciadorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao" ADD CONSTRAINT "transacao_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "oferta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao" ADD CONSTRAINT "transacao_transacaoOriginalId_fkey" FOREIGN KEY ("transacaoOriginalId") REFERENCES "transacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_credito" ADD CONSTRAINT "solicitacao_credito_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_associadoId_fkey" FOREIGN KEY ("associadoId") REFERENCES "associado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "agencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
