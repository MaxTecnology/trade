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
