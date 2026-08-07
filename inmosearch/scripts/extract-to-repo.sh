#!/usr/bin/env bash
# INMOSEARCH — Extrae el proyecto a un repositorio git independiente (import limpio).
# Uso (desde dentro de inmosearch/):
#   ./scripts/extract-to-repo.sh git@github.com:usuario/INMOSEARCH.git
# Crea antes el repo VACÍO en GitHub (sin README). Para conservar el historial,
# usa en su lugar `git subtree split` (ver docs/PRODUCCION.md).
set -euo pipefail

REMOTE="${1:-}"
if [ -z "$REMOTE" ]; then
  echo "Uso: ./scripts/extract-to-repo.sh <git-remote-url>"
  echo "Ej.: ./scripts/extract-to-repo.sh git@github.com:dvillagrablanco/INMOSEARCH.git"
  exit 1
fi

if [ ! -f package.json ] || ! grep -q '"name": "inmosearch"' package.json; then
  echo "Ejecuta este script desde dentro del directorio inmosearch/."
  exit 1
fi

TMP="$(mktemp -d)"
DEST="$TMP/INMOSEARCH"
echo "Copiando proyecto a $DEST ..."
mkdir -p "$DEST"
# Copia todo excepto artefactos y secretos.
tar --exclude='./node_modules' --exclude='./.next' --exclude='./.git' \
    --exclude='./prisma/dev.db' --exclude='./prisma/dev.db-journal' \
    --exclude='./.env' --exclude='./.env.local' \
    -cf - . | tar -xf - -C "$DEST"

cd "$DEST"
git init -q
git add .
git commit -qm "INMOSEARCH: initial import"
git branch -M main
git remote add origin "$REMOTE"
echo "Empujando a $REMOTE ..."
git push -u origin main
echo ""
echo "✓ Listo. Repositorio independiente creado en: $REMOTE"
echo "  Siguiente: npm install && cp .env.example .env && npm run db:push && npm run dev"
