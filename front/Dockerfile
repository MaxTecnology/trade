# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json yarn.lock* ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD wget -qO- http://127.0.0.1:80/ || exit 1
