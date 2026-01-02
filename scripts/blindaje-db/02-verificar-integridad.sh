#!/bin/bash
# 🔍 VERIFICACIÓN DE INTEGRIDAD DE CONFIGURACIÓN
# Este script verifica que toda la configuración crítica esté presente

set -e

APP_DIR="/opt/inmova-app"
ERRORS=0

echo "🔍 VERIFICACIÓN DE INTEGRIDAD DEL SISTEMA"
echo ""

# 1. Verificar que PostgreSQL está corriendo
echo "1️⃣  PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    echo "   ✅ PostgreSQL está activo"
else
    echo "   ❌ PostgreSQL NO está activo"
    ERRORS=$((ERRORS + 1))
fi

# 2. Verificar que la base de datos existe
echo "2️⃣  Base de datos inmova_production..."
if PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -lqt | cut -d \| -f 1 | grep -qw inmova_production; then
    echo "   ✅ Base de datos existe"
else
    echo "   ❌ Base de datos NO existe"
    ERRORS=$((ERRORS + 1))
fi

# 3. Verificar que el usuario PostgreSQL puede conectar
echo "3️⃣  Conexión a PostgreSQL..."
if PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ Conexión exitosa"
else
    echo "   ❌ NO se puede conectar a la base de datos"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar .env.production
echo "4️⃣  .env.production..."
if [ -f "$APP_DIR/.env.production" ]; then
    echo "   ✅ Archivo existe"
    
    # Verificar variables críticas
    if grep -q "DATABASE_URL=" "$APP_DIR/.env.production"; then
        echo "   ✅ DATABASE_URL presente"
    else
        echo "   ❌ DATABASE_URL FALTA"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "NEXTAUTH_SECRET=" "$APP_DIR/.env.production"; then
        echo "   ✅ NEXTAUTH_SECRET presente"
    else
        echo "   ❌ NEXTAUTH_SECRET FALTA"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "NEXTAUTH_URL=" "$APP_DIR/.env.production"; then
        echo "   ✅ NEXTAUTH_URL presente"
    else
        echo "   ❌ NEXTAUTH_URL FALTA"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ❌ .env.production NO EXISTE"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verificar usuarios críticos en BD
echo "5️⃣  Usuarios críticos en base de datos..."
USER_COUNT=$(PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production -t -c "SELECT COUNT(*) FROM users WHERE email IN ('superadmin@inmova.app', 'admin@inmova.app');" 2>/dev/null || echo "0")
USER_COUNT=$(echo $USER_COUNT | xargs) # trim whitespace

if [ "$USER_COUNT" -ge 1 ]; then
    echo "   ✅ $USER_COUNT usuario(s) crítico(s) presente(s)"
else
    echo "   ⚠️  NO HAY USUARIOS CRÍTICOS - Necesario crearlos"
    ERRORS=$((ERRORS + 1))
fi

# 6. Verificar tabla users existe
echo "6️⃣  Tabla users..."
if PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production -c "\d users" > /dev/null 2>&1; then
    echo "   ✅ Tabla users existe"
else
    echo "   ❌ Tabla users NO EXISTE"
    ERRORS=$((ERRORS + 1))
fi

# 7. Verificar tabla companies existe
echo "7️⃣  Tabla companies..."
if PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production -c "\d companies" > /dev/null 2>&1; then
    echo "   ✅ Tabla companies existe"
else
    echo "   ❌ Tabla companies NO EXISTE"
    ERRORS=$((ERRORS + 1))
fi

# 8. Verificar que PM2 está corriendo la app
echo "8️⃣  Aplicación PM2..."
if pm2 list | grep -q "inmova-app.*online"; then
    echo "   ✅ Aplicación está online"
else
    echo "   ⚠️  Aplicación NO está online"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ VERIFICACIÓN EXITOSA - Sistema íntegro"
    exit 0
else
    echo "❌ VERIFICACIÓN FALLIDA - $ERRORS error(es) encontrado(s)"
    echo ""
    echo "🔧 ACCIONES RECOMENDADAS:"
    echo "   1. Ejecutar: bash /opt/inmova-app/scripts/blindaje-db/03-restaurar-config.sh"
    echo "   2. Verificar logs: pm2 logs inmova-app"
    exit 1
fi
