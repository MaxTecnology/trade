#!/bin/sh
set -e

echo "Applying database migrations..."
node_modules/.bin/prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Running database seed..."
  node_modules/.bin/tsx prisma/seed.ts
else
  echo "Skipping seed (RUN_SEED not set to true)."
fi

echo "Starting API..."
exec node dist/server.js
