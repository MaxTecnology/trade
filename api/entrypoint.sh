#!/bin/sh
set -e

echo "Syncing database schema..."
node_modules/.bin/prisma db push

echo "Running database seed..."
node_modules/.bin/tsx prisma/seed.ts

echo "Starting API..."
exec node dist/server.js
