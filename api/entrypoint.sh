#!/bin/sh
set -e

echo "Applying database migrations..."
node_modules/.bin/prisma migrate deploy

echo "Running database seed..."
node_modules/.bin/tsx prisma/seed.ts

echo "Starting API..."
exec node dist/server.js
