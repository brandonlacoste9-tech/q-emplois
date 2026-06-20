#!/bin/sh
set -e

if [ -n "$MIGRATE_DATABASE_URL" ]; then
  echo "Running prisma migrate deploy (session pooler)..."
  DATABASE_URL="$MIGRATE_DATABASE_URL" npx prisma migrate deploy
elif [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q ':5432'; then
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy
else
  echo "Skipping migrate (set MIGRATE_DATABASE_URL to session pooler :5432 for auto-migrate)"
fi

exec node dist/main.js
