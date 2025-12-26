#!/bin/bash
# =============================================
# QUICK DEPLOYMENT - INMOVA en Hetzner
# Ejecutar en el servidor: bash QUICK_DEPLOY_HETZNER.sh
# =============================================

set -e

echo "🚀 INMOVA Quick Deploy - Iniciando..."
echo "Fecha: $(date)"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

APP_DIR="/opt/inmova"
DB_NAME="inmova_db"
DB_USER="inmova_user"

# Función para mostrar progreso
show_progress() {
    echo -e "${BLUE}▶ $1${NC}"
}

show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_error() {
    echo -e "${RED}❌ $1${NC}"
}

# =============================================
# PASO 1: Actualizar Código desde GitHub
# =============================================
show_progress "PASO 1/5: Actualizando código desde GitHub..."

if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/main
    show_success "Código actualizado desde origin/main"
else
    show_error "Directorio .git no encontrado. ¿La app está instalada en $APP_DIR?"
    exit 1
fi

# =============================================
# PASO 2: Instalar Dependencias
# =============================================
show_progress "PASO 2/5: Instalando dependencias..."

yarn install --production=false --ignore-engines
show_success "Dependencias instaladas"

# =============================================
# PASO 3: Generar Prisma Client y Sincronizar BD
# =============================================
show_progress "PASO 3/5: Generando Prisma Client..."

yarn prisma generate
show_success "Prisma Client generado"

show_progress "Sincronizando schema de base de datos..."
yarn prisma db push --skip-generate --accept-data-loss
show_success "Schema sincronizado"

# =============================================
# PASO 4: Crear Usuario Superadmin
# =============================================
show_progress "PASO 4/5: Creando usuario superadmin..."

# Verificar si el script SQL existe
if [ -f "$APP_DIR/CREATE_SUPERADMIN.sql" ]; then
    psql -U $DB_USER -d $DB_NAME -f "$APP_DIR/CREATE_SUPERADMIN.sql"
    show_success "Usuario superadmin creado"
else
    # Alternativa: usar el seed
    show_progress "Usando seed de Prisma..."
    yarn prisma db seed || yarn tsx scripts/seed.ts
    show_success "Seed ejecutado"
fi

echo ""
echo "🔑 Credenciales de acceso:"
echo "   📧 Email:    admin@inmova.app"
echo "   🔑 Password: Admin2025!"
echo "   👑 Rol:      super_admin"
echo ""

# =============================================
# PASO 5: Build y Reiniciar Aplicación
# =============================================
show_progress "PASO 5/5: Building aplicación..."

NODE_OPTIONS="--max-old-space-size=12288" yarn build
show_success "Build completado"

show_progress "Reiniciando aplicación con PM2..."

pm2 delete inmova 2>/dev/null || true
pm2 start yarn --name "inmova" -- start
pm2 save
show_success "Aplicación reiniciada"

# =============================================
# VERIFICACIÓN FINAL
# =============================================
echo ""
echo "========================================"
show_success "DEPLOYMENT COMPLETADO"
echo "========================================"
echo ""
echo "📊 Estado de la aplicación:"
pm2 status

echo ""
echo "🌐 URLs de acceso:"
echo "   • Landing:  https://inmova.app"
echo "   • Login:    https://inmova.app/login"
echo ""
echo "🔐 Credenciales superadmin:"
echo "   • Email:    admin@inmova.app"
echo "   • Password: Admin2025!"
echo ""
echo "📝 Ver logs en tiempo real:"
echo "   pm2 logs inmova"
echo ""
echo "✅ ¡Todo listo! La aplicación está desplegada y funcionando."
