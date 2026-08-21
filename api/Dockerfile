FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# node_modules do builder tem devDependencies (typescript, vitest, eslint...) —
# stage separado gera um node_modules limpo, só com dependencies reais
# (inclui prisma/tsx: usados em runtime por entrypoint.sh, não são dev-only
# apesar do nome do pacote).
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./
COPY entrypoint.sh ./entrypoint.sh

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chmod +x entrypoint.sh
USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=20s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["sh", "entrypoint.sh"]
