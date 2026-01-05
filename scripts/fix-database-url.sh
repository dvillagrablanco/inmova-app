#!/bin/bash

# Script para configurar DATABASE_URL y ejecutar migraciones
# Uso: ./fix-database-url.sh "postgresql://user:pass@host:port/db"

set -e

if [ -z "$1" ]; then
  echo "❌ Error: DATABASE_URL no proporcionado"
  echo ""
  echo "Uso:"
  echo "  ./fix-database-url.sh \"postgresql://user:pass@host:5432/db\""
  echo ""
  echo "Ejemplo:"
  echo "  ./fix-database-url.sh \"postgresql://inmova_user:password123@localhost:5432/inmova_production\""
  exit 1
fi

DATABASE_URL="$1"
ENV_FILE="/opt/inmova-app/.env.production"

echo "======================================================================"
echo "🔧 FIX: DATABASE_URL + MIGRACIONES"
echo "======================================================================"
echo ""

echo "[1/6] 📋 Backup de .env.production..."
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup creado"
echo ""

echo "[2/6] 🔑 Configurando DATABASE_URL..."
# Eliminar DATABASE_URL existente
sed -i '/^DATABASE_URL=/d' "$ENV_FILE"

# Agregar nuevo DATABASE_URL
echo "" >> "$ENV_FILE"
echo "# Database URL - Configurado $(date +%Y-%m-%d)" >> "$ENV_FILE"
echo "DATABASE_URL=$DATABASE_URL" >> "$ENV_FILE"

echo "✅ DATABASE_URL configurado"
echo ""

echo "[3/6] 🧪 Verificando conexión a BD..."
cd /opt/inmova-app
export DATABASE_URL="$DATABASE_URL"

# Test de conexión
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ Conexión exitosa"
else
  echo "❌ ERROR: No se puede conectar a la BD"
  echo ""
  echo "Verifica:"
  echo "  - Host y puerto correctos"
  echo "  - Usuario y password válidos"
  echo "  - Base de datos existe"
  echo "  - Firewall permite conexión"
  exit 1
fi
echo ""

echo "[4/6] 🚀 Ejecutando migraciones..."
if npx prisma migrate deploy; then
  echo "✅ Migraciones aplicadas"
else
  echo "⚠️  Migraciones fallaron, intentando db push..."
  if npx prisma db push --accept-data-loss; then
    echo "✅ Schema sincronizado con db push"
  else
    echo "❌ ERROR: No se pudo aplicar schema"
    exit 1
  fi
fi
echo ""

echo "[5/6] 🔄 Regenerando Prisma Client..."
npx prisma generate
echo "✅ Prisma Client regenerado"
echo ""

echo "[6/6] ♻️  Reiniciando aplicación..."
pm2 restart inmova-app --update-env
echo "✅ PM2 reiniciado"
echo ""
echo "⏳ Esperando 15 segundos para warm-up..."
sleep 15
echo ""

echo "======================================================================"
echo "🏥 HEALTH CHECK"
echo "======================================================================"
echo ""

# Health check
HEALTH=$(curl -s http://localhost:3000/api/health)
echo "API Health: $HEALTH"
echo ""

# Verificar que database status sea "connected"
if echo "$HEALTH" | grep -q '"database":"connected"'; then
  echo "✅ Base de datos CONECTADA"
else
  echo "⚠️  Base de datos estado desconocido"
fi
echo ""

echo "======================================================================"
echo "✅ FIX COMPLETADO"
echo "======================================================================"
echo ""
echo "Siguiente paso:"
echo "  1. Abrir https://inmovaapp.com/login"
echo "  2. Login con admin@inmova.app"
echo "  3. Verificar que dashboard carga datos"
echo ""
echo "Si sigue mostrando 'No hay datos':"
echo "  - Ver logs: pm2 logs inmova-app --lines 50"
echo "  - Verificar columnas: psql -d inmova_production -c \"\\d company\""
echo ""
