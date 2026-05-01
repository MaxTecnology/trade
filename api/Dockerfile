FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
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
CMD ["sh", "entrypoint.sh"]
