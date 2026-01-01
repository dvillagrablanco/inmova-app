#!/bin/bash
###############################################################################
# Script maestro para configurar sistema completo de demos
# Ejecutar: bash scripts/setup-demo-system.sh
###############################################################################

set -e

echo "🎭 CONFIGURACIÓN COMPLETA DEL SISTEMA DEMO"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Error: package.json no encontrado. Ejecuta desde el directorio raíz."
    exit 1
fi

# PASO 1: Seed de planes
log_step "PASO 1: Crear/Actualizar Planes de Suscripción"
log_info "Ejecutando seed de planes (incluye plan Demo)..."
npx tsx scripts/seed-subscription-plans.ts
log_success "Planes actualizados"

# PASO 2: Asignar planes a empresas existentes
log_step "PASO 2: Asignar Planes a Empresas Existentes"
log_info "Migrando empresas sin plan asignado..."
npx tsx scripts/migrate-companies-to-plans.ts
log_success "Empresas migradas"

# PASO 3: Limpiar empresas demo antiguas
log_step "PASO 3: Limpiar Empresas Demo Antiguas"
log_info "Buscando y eliminando empresas demo/test existentes..."
npx tsx scripts/cleanup-demo-companies.ts || log_warning "No se encontraron empresas demo para eliminar"
log_success "Limpieza completada"

# PASO 4: Crear empresas demo nuevas
log_step "PASO 4: Crear Empresas Demo con Datos Completos"
log_info "Creando 6 empresas demo con diferentes perfiles..."
npx tsx scripts/seed-demo-companies.ts
log_success "Empresas demo creadas"

# PASO 5: Verificar en base de datos
log_step "PASO 5: Verificación en Base de Datos"
log_info "Verificando empresas demo creadas..."

if command -v psql &> /dev/null && [ -f ".env.production" ]; then
    source .env.production
    psql $DATABASE_URL -c "SELECT nombre, email, \"subscriptionPlanId\" FROM \"Company\" WHERE email LIKE '%@demo.inmova.app%' OR nombre LIKE 'DEMO -%';" 2>/dev/null || log_warning "No se pudo conectar a la BD"
else
    log_warning "psql no disponible o .env.production no encontrado. Saltando verificación de BD."
fi

# RESUMEN FINAL
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Empresas Demo Creadas:"
echo ""
echo "1. DEMO - Propietario Individual"
echo "   👤 juan.propietario@demo.inmova.app / Demo123456!"
echo "   🏢 5 propiedades (Plan Basic)"
echo ""
echo "2. DEMO - Gestor Profesional"
echo "   👤 maria.gestora@demo.inmova.app / Demo123456!"
echo "   🏢 25 propiedades (Plan Professional)"
echo ""
echo "3. DEMO - Coliving Company"
echo "   👤 ana.coliving@demo.inmova.app / Demo123456!"
echo "   🏢 27 habitaciones coliving (Plan Business)"
echo ""
echo "4. DEMO - Alquiler Vacacional (STR)"
echo "   👤 luis.vacacional@demo.inmova.app / Demo123456!"
echo "   🏢 9 propiedades vacacionales (Plan Professional)"
echo ""
echo "5. DEMO - Gestora Inmobiliaria Grande"
echo "   👤 roberto.director@demo.inmova.app / Demo123456!"
echo "   🏢 67 propiedades (Plan Business/Enterprise)"
echo ""
echo "6. DEMO - Comunidad de Propietarios"
echo "   👤 carmen.admin@demo.inmova.app / Demo123456!"
echo "   🏢 42 propiedades en comunidades (Plan Professional)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 PRÓXIMOS PASOS:"
echo ""
echo "1. Hacer subscriptionPlanId obligatorio en schema.prisma:"
echo "   • Editar: prisma/schema.prisma"
echo "   • Cambiar: subscriptionPlanId String? → subscriptionPlanId String"
echo "   • Ejecutar: npx prisma migrate dev --name make_plan_required"
echo ""
echo "2. Deploy a producción (si aplica):"
echo "   • bash scripts/deploy-planes-production.sh"
echo ""
echo "3. Acceder a las empresas demo:"
echo "   • URL: https://inmovaapp.com/login"
echo "   • Usar credenciales listadas arriba"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
