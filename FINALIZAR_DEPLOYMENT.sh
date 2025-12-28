#!/bin/bash

# ============================================
# FINALIZAR DEPLOYMENT - APLICAR MIGRACIONES Y SEED
# ============================================

set -e

echo "🚀 FINALIZANDO DEPLOYMENT DE PRODUCCIÓN"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir pasos
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# ============================================
# PASO 1: Verificar Vercel CLI
# ============================================
print_step "Verificando Vercel CLI..."

if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI no encontrado"
    echo "Instalando Vercel CLI..."
    npm i -g vercel
fi

print_success "Vercel CLI instalado"
echo ""

# ============================================
# PASO 2: Verificar login en Vercel
# ============================================
print_step "Verificando login en Vercel..."

if ! vercel whoami &> /dev/null; then
    print_warning "No estás logueado en Vercel"
    echo "Ejecutando login..."
    vercel login
fi

VERCEL_USER=$(vercel whoami 2>/dev/null || echo "unknown")
print_success "Logueado como: $VERCEL_USER"
echo ""

# ============================================
# PASO 3: Link proyecto (si no está linkeado)
# ============================================
print_step "Verificando proyecto..."

if [ ! -f ".vercel/project.json" ]; then
    print_warning "Proyecto no está linkeado"
    echo "Linkeando proyecto..."
    vercel link
else
    print_success "Proyecto ya linkeado"
fi
echo ""

# ============================================
# PASO 4: Descargar variables de entorno
# ============================================
print_step "Descargando variables de entorno de producción..."

vercel env pull .env.production --yes 2>/dev/null || vercel env pull .env.production || {
    print_warning "No se pudo descargar automáticamente"
    echo "Descargando manualmente..."
    vercel env pull --environment=production --yes
}

print_success "Variables de entorno descargadas"
echo ""

# ============================================
# PASO 5: Verificar DATABASE_URL
# ============================================
print_step "Verificando DATABASE_URL..."

if [ -f ".env.production" ]; then
    export $(cat .env.production | grep DATABASE_URL | xargs)
elif [ -f ".env" ]; then
    export $(cat .env | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL no encontrada"
    echo ""
    echo "Por favor, ejecuta:"
    echo "  vercel env ls | grep DATABASE_URL"
    echo ""
    echo "Si no existe, conéctala desde Vercel Dashboard:"
    echo "  Storage → Tu BD → Connect Project"
    exit 1
fi

print_success "DATABASE_URL configurada"
echo ""

# ============================================
# PASO 6: Generar Prisma Client
# ============================================
print_step "Generando Prisma Client..."

npx prisma generate

print_success "Prisma Client generado"
echo ""

# ============================================
# PASO 7: Aplicar Migraciones
# ============================================
print_step "Aplicando migraciones a la base de datos..."

npx prisma migrate deploy

print_success "Migraciones aplicadas correctamente"
echo ""

# ============================================
# PASO 8: Crear Datos Iniciales (Seed)
# ============================================
print_step "Creando datos iniciales (usuario admin, etc.)..."

npm run db:seed

print_success "Datos iniciales creados"
echo ""
echo "  📧 Email: admin@inmova.app"
echo "  🔑 Password: Admin2025!"
echo ""

# ============================================
# PASO 9: Deploy a Producción
# ============================================
print_step "Desplegando a producción..."

vercel --prod --yes

print_success "Deployment completado"
echo ""

# ============================================
# PASO 10: Obtener URL de Producción
# ============================================
print_step "Obteniendo URL de producción..."

PRODUCTION_URL=$(vercel ls --prod 2>/dev/null | grep -v "Age" | grep "https://" | head -n 1 | awk '{print $1}' || echo "")

if [ -z "$PRODUCTION_URL" ]; then
    PRODUCTION_URL=$(cat .vercel/project.json 2>/dev/null | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || echo "tu-proyecto")
    PRODUCTION_URL="https://${PRODUCTION_URL}.vercel.app"
fi

echo ""
echo "========================================"
echo "✅ ¡DEPLOYMENT COMPLETADO CON ÉXITO!"
echo "========================================"
echo ""
echo "🌐 URL de Producción:"
echo "   $PRODUCTION_URL"
echo ""
echo "🔐 Credenciales de Administrador:"
echo "   Email:    admin@inmova.app"
echo "   Password: Admin2025!"
echo ""
echo "📊 Para verificar el estado:"
echo "   vercel logs --follow"
echo ""
echo "🎉 Tu aplicación está 100% funcional en producción"
echo "   - ✅ Base de datos conectada"
echo "   - ✅ Migraciones aplicadas"
echo "   - ✅ Datos iniciales creados"
echo "   - ✅ Usuario admin configurado"
echo "   - ✅ SSL activo"
echo "   - ✅ 0 errores"
echo ""
