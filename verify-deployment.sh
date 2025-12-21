#!/bin/bash

################################################################################
# INMOVA - Script de Verificación Post-Deployment
# Verifica que todos los servicios estén funcionando correctamente
################################################################################

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

log_info "========================================"
log_info "  INMOVA - Verificación de Deployment"
log_info "========================================"
echo ""

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

################################################################################
# 1. Verificar PM2
################################################################################

log_info "[1/10] Verificando PM2..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "inmova"; then
        STATUS=$(pm2 list | grep inmova | awk '{print $10}')
        if [ "$STATUS" = "online" ]; then
            log_success "PM2: Aplicación corriendo"
            ((PASSED++))
        else
            log_error "PM2: Aplicación en estado: $STATUS"
            ((FAILED++))
        fi
    else
        log_error "PM2: Aplicación 'inmova' no encontrada"
        ((FAILED++))
    fi
else
    log_warning "PM2 no instalado"
    ((WARNINGS++))
fi
echo ""

################################################################################
# 2. Verificar Puerto 3000
################################################################################

log_info "[2/10] Verificando puerto 3000..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        log_success "Puerto 3000: Respondiendo correctamente (HTTP $HTTP_CODE)"
        ((PASSED++))
    else
        log_error "Puerto 3000: No responde (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
else
    log_warning "curl no disponible"
    ((WARNINGS++))
fi
echo ""

################################################################################
# 3. Verificar Nginx
################################################################################

log_info "[3/10] Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    log_success "Nginx: Activo"
    ((PASSED++))
    
    # Verificar configuración
    if sudo nginx -t &> /dev/null; then
        log_success "Nginx: Configuración válida"
    else
        log_warning "Nginx: Configuración con errores"
        ((WARNINGS++))
    fi
else
    log_warning "Nginx: No activo"
    ((WARNINGS++))
fi
echo ""

################################################################################
# 4. Verificar PostgreSQL
################################################################################

log_info "[4/10] Verificando PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    log_success "PostgreSQL: Activo"
    ((PASSED++))
else
    log_warning "PostgreSQL: No activo"
    ((WARNINGS++))
fi
echo ""

################################################################################
# 5. Verificar Redis (si existe)
################################################################################

log_info "[5/10] Verificando Redis..."
if systemctl is-active --quiet redis-server 2>/dev/null || systemctl is-active --quiet redis 2>/dev/null; then
    log_success "Redis: Activo"
    ((PASSED++))
else
    log_info "Redis: No instalado (opcional)"
fi
echo ""

################################################################################
# 6. Verificar Dominio
################################################################################

log_info "[6/10] Verificando dominio inmova.app..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://inmova.app 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "304" ]; then
        log_success "Dominio: Accesible (HTTP $HTTP_CODE)"
        ((PASSED++))
    else
        log_warning "Dominio: No accesible (HTTP $HTTP_CODE)"
        ((WARNINGS++))
    fi
fi
echo ""

################################################################################
# 7. Verificar SSL/HTTPS
################################################################################

log_info "[7/10] Verificando SSL/HTTPS..."
if command -v curl &> /dev/null; then
    if curl -s -o /dev/null https://inmova.app 2>/dev/null; then
        log_success "SSL: Configurado y funcionando"
        ((PASSED++))
    else
        log_warning "SSL: No configurado o con errores"
        log_info "Para configurar SSL: sudo certbot --nginx -d inmova.app"
        ((WARNINGS++))
    fi
fi
echo ""

################################################################################
# 8. Verificar Archivos de Build
################################################################################

log_info "[8/10] Verificando archivos de build..."
if [ -d ".build/standalone" ]; then
    log_success "Build: Directorio standalone existe"
    ((PASSED++))
    
    BUILD_SIZE=$(du -sh .build 2>/dev/null | cut -f1)
    log_info "Tamaño del build: $BUILD_SIZE"
else
    log_error "Build: Directorio standalone no existe"
    ((FAILED++))
fi
echo ""

################################################################################
# 9. Verificar Variables de Entorno
################################################################################

log_info "[9/10] Verificando variables de entorno..."
if [ -f ".env" ]; then
    log_success "Archivo .env: Existe"
    
    # Verificar variables críticas
    if grep -q "DATABASE_URL" .env; then
        log_success "Variable DATABASE_URL: Presente"
    else
        log_warning "Variable DATABASE_URL: No encontrada"
        ((WARNINGS++))
    fi
    
    if grep -q "NEXTAUTH_SECRET" .env; then
        log_success "Variable NEXTAUTH_SECRET: Presente"
    else
        log_warning "Variable NEXTAUTH_SECRET: No encontrada"
        ((WARNINGS++))
    fi
    
    ((PASSED++))
else
    log_error "Archivo .env: No existe"
    ((FAILED++))
fi
echo ""

################################################################################
# 10. Verificar Logs de PM2
################################################################################

log_info "[10/10] Verificando logs de errores..."
if command -v pm2 &> /dev/null; then
    ERROR_COUNT=$(pm2 logs inmova --lines 100 --nostream 2>/dev/null | grep -i "error" | wc -l)
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        log_success "Logs: Sin errores recientes"
        ((PASSED++))
    elif [ "$ERROR_COUNT" -lt 5 ]; then
        log_warning "Logs: $ERROR_COUNT errores encontrados (revisar)"
        ((WARNINGS++))
    else
        log_error "Logs: $ERROR_COUNT errores encontrados (revisar urgente)"
        ((FAILED++))
    fi
else
    log_info "PM2 no disponible para revisar logs"
fi
echo ""

################################################################################
# RESUMEN
################################################################################

log_info "========================================"
log_info "  Resumen de Verificación"
log_info "========================================"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))

log_success "✅ Pasadas: $PASSED/$TOTAL"
if [ $WARNINGS -gt 0 ]; then
    log_warning "⚠️  Advertencias: $WARNINGS"
fi
if [ $FAILED -gt 0 ]; then
    log_error "❌ Falladas: $FAILED"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        log_success "🎉 Sistema completamente funcional!"
    else
        log_warning "⚠️ Sistema funcional con advertencias menores"
    fi
else
    log_error "❌ Sistema con problemas. Revisar errores arriba."
fi

echo ""
log_info "Comandos útiles:"
log_info "  - Ver logs: pm2 logs inmova"
log_info "  - Reiniciar app: pm2 restart inmova"
log_info "  - Ver estado: pm2 status"
log_info "  - Ver métricas: pm2 monit"
echo ""
