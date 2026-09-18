#!/usr/bin/env bash
# Idempotent Cloud Agent setup for the Luna Sushi Bar Next.js app.
set -euo pipefail

cd "$(dirname "$0")/../luna"

# Local SQLite connection string used by Prisma and the Next.js dev server.
# .env is gitignored, so create it on first run.
if [ ! -f .env ]; then
  printf 'DATABASE_URL="file:./dev.db"\n' > .env
fi

# Install dependencies from the lockfile (postinstall runs `prisma generate`).
npm ci

# Sync the SQLite schema and load demo data (categories, 43 rolls, users, orders).
npm run db:push
npm run db:seed
