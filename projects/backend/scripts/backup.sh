#!/bin/sh
# Backup de MongoDB per AGENTS.md §5: respaldo preventivo antes de cualquier cambio
set -e

FECHA=$(date +%Y%m%d_%H%M%S)
DIR_BACKUP="${PATH_BACKUPS}/${PROJECT_NAME:-educoro_ai}_${FECHA}"
MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/educoro_ai}"

mkdir -p "${DIR_BACKUP}"
mongodump --uri="$MONGO_URI" --out="${DIR_BACKUP}/mongodb_dump"

echo "✅ Backup creado en ${DIR_BACKUP}/mongodb_dump"
