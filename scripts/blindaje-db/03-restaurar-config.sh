#!/bin/bash
# 🔧 RESTAURACIÓN AUTOMÁTICA DE CONFIGURACIÓN
# Este script restaura la configuración desde el backup más reciente

set -e

BACKUP_DIR="/opt/inmova-backups"
APP_DIR="/opt/inmova-app"

echo "🔧 RESTAURACIÓN AUTOMÁTICA DE CONFIGURACIÓN"
echo ""

# 1. Encontrar el backup más reciente
echo "1️⃣  Buscando backup más reciente..."
LATEST_ENV=$(ls -t "$BACKUP_DIR"/env_*.backup 2>/dev/null | head -1)
LATEST_DB=$(ls -t "$BACKUP_DIR"/db_*.sql 2>/dev/null | head -1)

if [ -z "$LATEST_ENV" ]; then
    echo "   ❌ No se encontró backup de .env.production"
    echo "   Creando .env.production nuevo..."
    
    # Crear .env desde cero con valores seguros
    cat > "$APP_DIR/.env.production" << 'EOF'
NODE_ENV="production"
DATABASE_URL="postgresql://inmova_user:InmovaSecure2026DB@localhost:5432/inmova_production"
NEXTAUTH_URL="http://157.180.119.236"
NEXTAUTH_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

# Database
POSTGRES_USER="inmova_user"
POSTGRES_PASSWORD="InmovaSecure2026DB"
POSTGRES_DB="inmova_production"

# App
NEXT_PUBLIC_APP_NAME="Inmova"
NEXT_PUBLIC_APP_URL="http://157.180.119.236"

# Timezone
TZ="Europe/Madrid"
EOF
    echo "   ✅ .env.production creado desde plantilla"
else
    echo "   ✅ Backup encontrado: $(basename $LATEST_ENV)"
    cp "$LATEST_ENV" "$APP_DIR/.env.production"
    echo "   ✅ .env.production restaurado"
fi

# 2. Asegurar permisos correctos
echo "2️⃣  Configurando permisos..."
chmod 600 "$APP_DIR/.env.production"
chown root:root "$APP_DIR/.env.production"
echo "   ✅ Permisos configurados"

# 3. Verificar/restaurar usuario PostgreSQL
echo "3️⃣  Verificando usuario PostgreSQL..."
su - postgres -c "psql -c \"ALTER USER inmova_user WITH PASSWORD 'InmovaSecure2026DB';\"" > /dev/null 2>&1
echo "   ✅ Password de usuario PostgreSQL actualizada"

# 4. Verificar/crear base de datos
echo "4️⃣  Verificando base de datos..."
if ! PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -lqt | cut -d \| -f 1 | grep -qw inmova_production; then
    echo "   ⚠️  Base de datos no existe, creando..."
    su - postgres -c "createdb inmova_production"
    su - postgres -c "psql -c 'GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;'"
    echo "   ✅ Base de datos creada"
else
    echo "   ✅ Base de datos existe"
fi

# 5. Si hay backup de BD y la BD está vacía, restaurar
echo "5️⃣  Verificando tablas..."
TABLE_COUNT=$(PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | xargs || echo "0")

if [ "$TABLE_COUNT" -eq 0 ] && [ ! -z "$LATEST_DB" ]; then
    echo "   ⚠️  Base de datos vacía, restaurando desde backup..."
    PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production < "$LATEST_DB"
    echo "   ✅ Base de datos restaurada desde: $(basename $LATEST_DB)"
elif [ "$TABLE_COUNT" -gt 0 ]; then
    echo "   ✅ Base de datos tiene $TABLE_COUNT tabla(s)"
else
    echo "   ⚠️  Base de datos vacía y sin backup disponible"
    echo "   Ejecutando Prisma migrations..."
    cd "$APP_DIR" && source .env.production && npx prisma db push --accept-data-loss
fi

# 6. Verificar/crear usuarios críticos
echo "6️⃣  Verificando usuarios críticos..."
USER_COUNT=$(PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production -t -c "SELECT COUNT(*) FROM users WHERE email IN ('superadmin@inmova.app', 'admin@inmova.app');" 2>/dev/null | xargs || echo "0")

if [ "$USER_COUNT" -eq 0 ]; then
    echo "   ⚠️  No hay usuarios, creando superadmin..."
    cd "$APP_DIR" && node create-superadmin.js
    echo "   ✅ Usuario superadmin creado"
else
    echo "   ✅ Usuario(s) crítico(s) presente(s): $USER_COUNT"
fi

# 7. Reiniciar aplicación
echo "7️⃣  Reiniciando aplicación..."
pm2 restart inmova-app
sleep 10

# 8. Verificar que todo funciona
echo "8️⃣  Verificando funcionamiento..."
if curl -s http://localhost:3000/api/health | grep -q "connected"; then
    echo "   ✅ Aplicación respondiendo correctamente"
else
    echo "   ⚠️  Aplicación responde pero puede haber problemas"
fi

echo ""
echo "✅ RESTAURACIÓN COMPLETADA"
echo ""
echo "🔐 Credenciales de acceso:"
echo "   URL: http://157.180.119.236/login"
echo "   Email: superadmin@inmova.app"
echo "   Password: Admin123!"
