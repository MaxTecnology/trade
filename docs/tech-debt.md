# Débito técnico — Rede Trade

## Constraints de domínio aplicadas via seed.ts, não via migration formal
`saldo_nao_negativo`, `valor_rt_positivo` e demais `CHECK` constraints são aplicadas via `$executeRaw` idempotente dentro de `api/prisma/seed.ts`, não pela migration do Prisma. Um ambiente que rode só `prisma migrate deploy` sem executar o seed (ex.: pipeline futuro que separe seed de migration) sobe sem essas constraints de integridade — risco real dado que são regras invioláveis do domínio (ver `CLAUDE.md`).
**Ação futura:** mover para uma migration Prisma formal (`prisma migrate dev --create-only` + editar SQL).

## Imagem de produção da API carrega `devDependencies` inteiras
`api/Dockerfile` tem um estágio `base` (`npm ci --only=production`) que nunca é usado — o estágio `production` copia `node_modules` do `builder`, que instalou tudo (`npm ci` completo). Isso acontece porque `prisma` e `tsx` (usados em runtime pelo `entrypoint.sh` para `migrate deploy`/seed) estão em `devDependencies`.
**Ação futura:** mover `prisma` e `tsx` para `dependencies` e ajustar o Dockerfile para copiar `node_modules` do estágio `base` — reduz tamanho de imagem e superfície de CVE. Precisa validar que o Prisma Client gerado no `builder` continua acessível (ver onde `prisma generate` grava o client) antes de trocar a origem do `node_modules`.

## Seed roda em todo boot do container (idempotente, mas não ideal)
`entrypoint.sh` executa `prisma/seed.ts` a cada start/restart do container `api`, não só na primeira vez. Confirmado idempotente (upserts com `update: {}`), mas adiciona latência em todo restart e mistura responsabilidade de bootstrap com runtime.
**Ação futura:** separar seed do boot automático — rodar uma vez via `docker compose run --rm api npm run db:seed` ou flag `RUN_SEED` controlada manualmente no primeiro deploy.

## `limiteVendaMensal`/`limiteVendaTotal` limitam o comprador, não o vendedor (nome sugere o contrário)
Achado na revisão final da branch `feature/limite-credito-e-limite-venda`: os campos se chamam "limite de **venda**", mas `validarLimiteVenda` (`api/src/shared/utils/limites.ts`) agrega débitos da conta do **comprador**, ou seja, limitam quanto o associado pode *comprar*, não vender. Isso preserva o comportamento que já existia antes (o antigo `plano.limiteRT` também limitava o comprador) — não é regressão desta branch, mas o nome do campo (herdado do front, ver `Form_Operacoes.jsx`) sugere o oposto. Hoje não existe nenhum teto pro volume de *vendas* de um associado.
**Ação futura:** decisão de produto — renomear os campos pra refletir o que fazem (ex: `limiteCompraMensal`/`limiteCompraTotal`), ou adicionar um teto de vendas separado se isso for realmente necessário pro negócio.

## Cobertura de teste parcial em `limites.ts`
Só `saldoSuficienteParaDebito` (função pura) tem teste automatizado. `getLimiteCreditoDaConta` e `validarLimiteVenda` (as duas funções que tocam banco) não têm cobertura — `validarLimiteVenda` também é difícil de testar como está porque importa `prisma` diretamente (sem injeção de dependência).
**Ação futura:** se/quando esse módulo crescer, considerar aceitar um `client: PrismaClient | Prisma.TransactionClient` como parâmetro pra permitir teste com client mockado.

## Corte de "mês corrente" em `validarLimiteVenda` usa timezone do servidor
`limites.ts` calcula início do mês com `setDate(1)/setHours(0,0,0,0)`, que resolve no timezone do container (UTC em produção), não no timezone de negócio (UTC-3). Transações nas primeiras 3h do mês (horário de Brasília) contam pro mês anterior. Comportamento pré-existente (idêntico ao `plano.limiteRT` que essa branch substituiu), não é regressão nova.
**Ação futura:** usar timezone explícito de negócio no cálculo, não o do servidor.

## `TASK.md` desatualizado após a migração de limiteRT do plano pra limiteVendaMensal/Total
`api/docs/TASK.md` ainda lista como concluído "Validar limite RT do plano antes de criar oferta" e "Validar limite mensal do plano" — ambos descrevem comportamento retirado por essa branch (ver `SPEC.md` §9, já atualizado). `TASK.md` é checklist histórico de construção, baixo risco, mas vale sincronizar numa próxima passada de limpeza de docs.
