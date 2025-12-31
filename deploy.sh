#!/bin/bash
#
# 🚀 Deployment Script para Inmova App
# Ejecutar como usuario 'deploy'
#
# Uso: bash deploy.sh
#

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Banner
echo ""
echo "╔════════════════════════════════════╗"
echo "║   Inmova App - Deployment          ║"
echo "║   PropTech Platform                ║"
echo "╚════════════════════════════════════╝"
echo ""

# Verificar que no se ejecute como root
if [ "$EUID" -eq 0 ]; then 
    print_error "No ejecutes este script como root. Usa el usuario 'deploy'"
    exit 1
fi

# Verificar que existe .env.production
if [ ! -f ".env.production" ]; then
    print_error "Archivo .env.production no encontrado"
    print_info "Crea el archivo .env.production con las variables necesarias"
    exit 1
fi

print_step "Iniciando deployment..."
echo ""

# 1. Pull latest code
print_step "1/8 - Obteniendo última versión del código..."
git fetch origin
CURRENT_BRANCH=$(git branch --show-current)
print_info "Branch actual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "No estás en la branch 'main'. ¿Continuar? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelado"
        exit 0
    fi
fi

git pull origin $CURRENT_BRANCH

# 2. Backup database
print_step "2/8 - Creando backup de base de datos..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups"
mkdir -p $BACKUP_DIR

if docker-compose -f docker-compose.production.yml ps postgres | grep -q "Up"; then
    docker-compose -f docker-compose.production.yml exec -T postgres \
        pg_dump -U inmova_user inmova > "$BACKUP_DIR/db_before_deploy_$TIMESTAMP.sql" 2>/dev/null || \
        print_warning "No se pudo crear backup de BD (¿primera vez?)"
    
    if [ -f "$BACKUP_DIR/db_before_deploy_$TIMESTAMP.sql" ]; then
        print_step "Backup guardado: db_before_deploy_$TIMESTAMP.sql"
    fi
else
    print_info "PostgreSQL no está corriendo, saltando backup"
fi

# 3. Stop containers
print_step "3/8 - Deteniendo containers..."
docker-compose -f docker-compose.production.yml down

# 4. Build new images
print_step "4/8 - Construyendo nueva imagen..."
docker-compose -f docker-compose.production.yml build --no-cache app

# 5. Start containers
print_step "5/8 - Iniciando containers..."
docker-compose -f docker-compose.production.yml up -d

# 6. Wait for app to be ready
print_step "6/8 - Esperando que la aplicación esté lista..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker-compose -f docker-compose.production.yml exec -T app curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_step "Aplicación lista!"
        break
    fi
    
    ATTEMPT=$((ATTEMPT+1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        print_error "La aplicación no respondió después de $MAX_ATTEMPTS intentos"
        print_info "Verifica los logs: docker-compose logs -f app"
        exit 1
    fi
    
    echo -n "."
    sleep 2
done
echo ""

# 7. Run migrations
print_step "7/8 - Ejecutando migraciones de base de datos..."
docker-compose -f docker-compose.production.yml exec -T app npx prisma migrate deploy

# 8. Health check
print_step "8/8 - Verificando estado del sistema..."
echo ""

# Check all services
print_info "Estado de servicios:"
docker-compose -f docker-compose.production.yml ps

echo ""
print_info "Verificando endpoints..."

# Check health endpoint
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_step "✓ Health check: OK"
else
    print_error "✗ Health check: FAIL"
fi

# Check version endpoint
if curl -f http://localhost:3000/api/version > /dev/null 2>&1; then
    print_step "✓ Version endpoint: OK"
else
    print_warning "✗ Version endpoint: FAIL"
fi

echo ""
echo "╔════════════════════════════════════╗"
echo "║  ✅ Deployment Completado          ║"
echo "╚════════════════════════════════════╝"
echo ""

print_info "Información del deployment:"
echo "  • Timestamp: $TIMESTAMP"
echo "  • Branch: $CURRENT_BRANCH"
echo "  • Commit: $(git log -1 --format='%h - %s')"
echo "  • Backup: $BACKUP_DIR/db_before_deploy_$TIMESTAMP.sql"
echo ""

print_info "Comandos útiles:"
echo "  • Ver logs:    docker-compose -f docker-compose.production.yml logs -f app"
echo "  • Ver estado:  docker-compose -f docker-compose.production.yml ps"
echo "  • Restart app: docker-compose -f docker-compose.production.yml restart app"
echo "  • Rollback:    git checkout <commit> && bash deploy.sh"
echo ""

print_step "Deployment finalizado exitosamente! 🎉"
echo ""
