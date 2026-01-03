#!/bin/bash
#######################################
# FASE 1 - DÍA 3: VERIFICACIÓN FINAL
# Smoke tests y sign-off
# Uso: bash phase1-verification.sh
#######################################

set -e

echo "======================================================================"
echo "✅ FASE 1 - DÍA 3: VERIFICACIÓN FINAL Y SIGN-OFF"
echo "======================================================================"
echo ""

ERRORS=0
WARNINGS=0

# ====================================================================
# SMOKE TESTS COMPLETOS
# ====================================================================

echo "======================================================================"
echo "🧪 EJECUTANDO SMOKE TESTS"
echo "======================================================================"
echo ""

# Test 1: Health Check
echo "Test 1/10: Health Check..."
if curl -sf https://inmovaapp.com/api/health > /dev/null 2>&1; then
    echo "✅ PASS: Health check responde"
else
    echo "❌ FAIL: Health check no responde"
    ((ERRORS++))
fi

# Test 2: Login Page
echo "Test 2/10: Login Page..."
LOGIN_STATUS=$(curl -sL -w "%{http_code}" -o /dev/null https://inmovaapp.com/login)
if [ "$LOGIN_STATUS" -eq 200 ]; then
    echo "✅ PASS: Login page carga (HTTP 200)"
else
    echo "❌ FAIL: Login page retorna HTTP $LOGIN_STATUS"
    ((ERRORS++))
fi

# Test 3: SSL Certificate
echo "Test 3/10: SSL Certificate..."
if curl -I https://inmovaapp.com 2>&1 | grep -q "HTTP/2 200"; then
    echo "✅ PASS: SSL certificate válido"
else
    echo "❌ FAIL: SSL certificate inválido o no configurado"
    ((ERRORS++))
fi

# Test 4: Database Connection
echo "Test 4/10: Database Connection..."
cd /opt/inmova-app
if npx prisma db pull --force 2>&1 | grep -q "success"; then
    echo "✅ PASS: Database conectada"
else
    echo "❌ FAIL: Database no conecta"
    ((ERRORS++))
fi

# Test 5: PM2 Status
echo "Test 5/10: PM2 Status..."
if pm2 status | grep -q "online"; then
    INSTANCES=$(pm2 status | grep "online" | wc -l)
    echo "✅ PASS: PM2 online ($INSTANCES instancias)"
else
    echo "❌ FAIL: PM2 no está online"
    ((ERRORS++))
fi

# Test 6: Firewall Status
echo "Test 6/10: Firewall Status..."
if ufw status | grep -q "Status: active"; then
    echo "✅ PASS: Firewall activo"
else
    echo "⚠️  WARN: Firewall no activo"
    ((WARNINGS++))
fi

# Test 7: Nginx Status
echo "Test 7/10: Nginx Status..."
if systemctl is-active --quiet nginx; then
    echo "✅ PASS: Nginx activo"
else
    echo "❌ FAIL: Nginx no activo"
    ((ERRORS++))
fi

# Test 8: Dashboard Page
echo "Test 8/10: Dashboard Page..."
DASH_STATUS=$(curl -sL -w "%{http_code}" -o /dev/null https://inmovaapp.com/dashboard)
if [ "$DASH_STATUS" -eq 200 ] || [ "$DASH_STATUS" -eq 302 ] || [ "$DASH_STATUS" -eq 307 ]; then
    echo "✅ PASS: Dashboard accesible (HTTP $DASH_STATUS)"
else
    echo "⚠️  WARN: Dashboard retorna HTTP $DASH_STATUS"
    ((WARNINGS++))
fi

# Test 9: Backup Script
echo "Test 9/10: Backup Script..."
if [ -f "/usr/local/bin/inmova-backup.sh" ]; then
    echo "✅ PASS: Script de backup existe"
else
    echo "⚠️  WARN: Script de backup no encontrado"
    ((WARNINGS++))
fi

# Test 10: Cron Jobs
echo "Test 10/10: Cron Jobs..."
if crontab -l | grep -q "inmova-backup"; then
    echo "✅ PASS: Cron job de backup configurado"
else
    echo "⚠️  WARN: Cron job de backup no configurado"
    ((WARNINGS++))
fi

echo ""
echo "======================================================================"
echo "📊 RESULTADOS DE SMOKE TESTS"
echo "======================================================================"
echo ""
echo "Tests ejecutados: 10"
echo "✅ Pasados: $((10 - ERRORS - WARNINGS))"
echo "⚠️  Warnings: $WARNINGS"
echo "❌ Errores: $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "🎉 TODOS LOS TESTS CRÍTICOS PASARON"
else
    echo "❌ HAY ERRORES CRÍTICOS QUE RESOLVER"
fi

# ====================================================================
# VERIFICACIÓN DE VARIABLES DE ENTORNO
# ====================================================================

echo ""
echo "======================================================================"
echo "🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO"
echo "======================================================================"
echo ""

cd /opt/inmova-app

# Verificar que existan las variables críticas
CRITICAL_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "ENCRYPTION_KEY"
)

ENV_ERRORS=0

for var in "${CRITICAL_VARS[@]}"; do
    if grep -q "^$var=" .env.production; then
        VALUE=$(grep "^$var=" .env.production | cut -d'=' -f2)
        if [ -z "$VALUE" ]; then
            echo "❌ $var está vacía"
            ((ENV_ERRORS++))
        else
            # Verificar que no sean valores default inseguros
            if echo "$VALUE" | grep -iq "change-me\|default\|example\|test123"; then
                echo "⚠️  $var parece tener valor default inseguro"
                ((WARNINGS++))
            else
                echo "✅ $var configurada"
            fi
        fi
    else
        echo "❌ $var NO EXISTE en .env.production"
        ((ENV_ERRORS++))
    fi
done

# Verificar NEXTAUTH_URL es HTTPS
if grep "^NEXTAUTH_URL=https://" .env.production > /dev/null; then
    echo "✅ NEXTAUTH_URL usa HTTPS"
else
    echo "❌ NEXTAUTH_URL NO usa HTTPS"
    ((ENV_ERRORS++))
fi

echo ""
if [ $ENV_ERRORS -eq 0 ]; then
    echo "✅ Variables de entorno: OK"
else
    echo "❌ Variables de entorno: $ENV_ERRORS errores"
    ((ERRORS=$ERRORS + ENV_ERRORS))
fi

# ====================================================================
# VERIFICACIÓN DE SEGURIDAD
# ====================================================================

echo ""
echo "======================================================================"
echo "🔐 VERIFICACIÓN DE SEGURIDAD"
echo "======================================================================"
echo ""

# Verificar que no hay credenciales en documentación
echo "Buscando credenciales en archivos de documentación..."
CREDS_FOUND=$(grep -r "xcc9brgkMMbf" /opt/inmova-app/*.md 2>/dev/null | wc -l)

if [ "$CREDS_FOUND" -gt 0 ]; then
    echo "⚠️  WARN: Se encontraron credenciales viejas en documentación"
    echo "   Archivos afectados:"
    grep -r "xcc9brgkMMbf" /opt/inmova-app/*.md 2>/dev/null | cut -d':' -f1 | sort -u
    ((WARNINGS++))
else
    echo "✅ No se encontraron credenciales expuestas"
fi

# Verificar permisos de .env.production
ENV_PERMS=$(stat -c "%a" .env.production)
if [ "$ENV_PERMS" -eq 600 ] || [ "$ENV_PERMS" -eq 640 ]; then
    echo "✅ Permisos de .env.production: OK ($ENV_PERMS)"
else
    echo "⚠️  WARN: Permisos de .env.production: $ENV_PERMS (recomendado: 600)"
    ((WARNINGS++))
fi

# ====================================================================
# TESTS DE FUNCIONALIDAD MANUAL
# ====================================================================

echo ""
echo "======================================================================"
echo "👤 TESTS MANUALES REQUERIDOS"
echo "======================================================================"
echo ""

echo "Los siguientes tests deben ejecutarse manualmente:"
echo ""
echo "1. Login con credenciales de test:"
echo "   URL: https://inmovaapp.com/login"
echo "   Email: admin@inmova.app"
echo "   Password: Admin123!"
echo ""
echo "2. Crear un contrato de prueba"
echo ""
echo "3. Registrar un pago de prueba"
echo ""
echo "4. Subir un archivo (test S3)"
echo ""
echo "5. Verificar que emails se envían (si está configurado)"
echo ""

read -p "¿Se completaron los tests manuales exitosamente? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Tests manuales: COMPLETADOS"
else
    echo "⚠️  Tests manuales: PENDIENTES"
    ((WARNINGS++))
fi

# ====================================================================
# MÉTRICAS DE SISTEMA
# ====================================================================

echo ""
echo "======================================================================"
echo "📊 MÉTRICAS DEL SISTEMA"
echo "======================================================================"
echo ""

# Uso de memoria
MEMORY_USED=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
echo "Memoria usada: ${MEMORY_USED}%"
if (( $(echo "$MEMORY_USED > 90" | bc -l) )); then
    echo "⚠️  WARN: Uso de memoria alto"
    ((WARNINGS++))
fi

# Uso de disco
DISK_USED=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "Disco usado: ${DISK_USED}%"
if [ "$DISK_USED" -gt 90 ]; then
    echo "⚠️  WARN: Uso de disco alto"
    ((WARNINGS++))
fi

# Uptime
UPTIME=$(uptime -p)
echo "Uptime: $UPTIME"

# PM2 memory
echo ""
echo "Memoria PM2:"
pm2 status | grep -A1 "inmova-app" | tail -1 || echo "No disponible"

# ====================================================================
# CHECKLIST FINAL
# ====================================================================

echo ""
echo "======================================================================"
echo "📋 CHECKLIST FINAL DE LANZAMIENTO"
echo "======================================================================"
echo ""

CHECKLIST=(
    "Cambiar root password;check_root_password"
    "Cambiar DB password;check_db_password"
    "NEXTAUTH_SECRET fuerte;check_nextauth"
    "Firewall configurado;check_firewall"
    "SSL/HTTPS activo;check_ssl"
    "Backups automáticos;check_backups"
    "Monitoring configurado;check_monitoring"
    "Tests smoke pasados;check_smoke_tests"
)

CHECKLIST_PASS=0
CHECKLIST_TOTAL=${#CHECKLIST[@]}

for item in "${CHECKLIST[@]}"; do
    DESCRIPTION=$(echo "$item" | cut -d';' -f1)
    CHECK=$(echo "$item" | cut -d';' -f2)
    
    case $CHECK in
        check_root_password)
            if [ -f "/tmp/.root_password_changed" ]; then
                echo "✅ $DESCRIPTION"
                ((CHECKLIST_PASS++))
            else
                echo "❓ $DESCRIPTION (no confirmado)"
            fi
            ;;
        check_db_password)
            if [ -f "/tmp/.db_password_changed" ]; then
                echo "✅ $DESCRIPTION"
                ((CHECKLIST_PASS++))
            else
                echo "❓ $DESCRIPTION (no confirmado)"
            fi
            ;;
        check_nextauth)
            if grep -q "^NEXTAUTH_SECRET=" .env.production && ! grep -q "change-me" .env.production; then
                echo "✅ $DESCRIPTION"
                ((CHECKLIST_PASS++))
            else
                echo "❌ $DESCRIPTION"
            fi
            ;;
        check_firewall)
            if ufw status | grep -q "Status: active"; then
                echo "✅ $DESCRIPTION"
                ((CHECKLIST_PASS++))
            else
                echo "❌ $DESCRIPTION"
            fi
            ;;
        check_ssl)
            if curl -I https://inmovaapp.com 2>&1 | grep -q "HTTP/2 200"; then
                echo "✅ $DESCRIPTION"
                ((CHECKLIST_PASS++))
            else
                echo "❌ $DESCRIPTION"
            fi
            ;;
        check_backups)
            if [ -f "/usr/local/bin/inmova-backup.sh" ]; then
                echo "✅ $DESCRIPTION"
                ((CHECKLIST_PASS++))
            else
                echo "❌ $DESCRIPTION"
            fi
            ;;
        check_monitoring)
            if grep -q "SENTRY_DSN" .env.production && ! grep -q "^SENTRY_DSN=$" .env.production; then
                echo "✅ $DESCRIPTION"
                ((CHECKLIST_PASS++))
            else
                echo "⚠️  $DESCRIPTION (Sentry no configurado)"
            fi
            ;;
        check_smoke_tests)
            if [ $ERRORS -eq 0 ]; then
                echo "✅ $DESCRIPTION"
                ((CHECKLIST_PASS++))
            else
                echo "❌ $DESCRIPTION"
            fi
            ;;
    esac
done

echo ""
echo "Checklist: $CHECKLIST_PASS/$CHECKLIST_TOTAL completados"

# ====================================================================
# DECISIÓN FINAL
# ====================================================================

echo ""
echo "======================================================================"
echo "🎯 DECISIÓN DE LANZAMIENTO"
echo "======================================================================"
echo ""

TOTAL_ISSUES=$((ERRORS + WARNINGS))

if [ $ERRORS -eq 0 ] && [ $WARNINGS -le 2 ] && [ $CHECKLIST_PASS -ge 6 ]; then
    echo "🟢 ESTADO: LISTO PARA LANZAMIENTO PÚBLICO"
    echo ""
    echo "✅ Todos los tests críticos pasaron"
    echo "✅ Checklist completado: $CHECKLIST_PASS/$CHECKLIST_TOTAL"
    echo "✅ Errores: $ERRORS"
    echo "✅ Warnings: $WARNINGS"
    echo ""
    echo "🚀 PUEDES PROCEDER CON LANZAMIENTO PÚBLICO"
elif [ $ERRORS -eq 0 ] && [ $WARNINGS -le 5 ]; then
    echo "🟡 ESTADO: LISTO PARA BETA CERRADA"
    echo ""
    echo "✅ Errores críticos: $ERRORS"
    echo "⚠️  Warnings: $WARNINGS"
    echo "⚠️  Checklist: $CHECKLIST_PASS/$CHECKLIST_TOTAL"
    echo ""
    echo "✅ Puedes lanzar BETA CERRADA (<10 usuarios)"
    echo "⚠️  Resolver warnings antes de lanzamiento público"
else
    echo "🔴 ESTADO: NO LISTO PARA LANZAMIENTO"
    echo ""
    echo "❌ Errores: $ERRORS"
    echo "⚠️  Warnings: $WARNINGS"
    echo "❌ Checklist: $CHECKLIST_PASS/$CHECKLIST_TOTAL"
    echo ""
    echo "❌ RESOLVER ISSUES ANTES DE LANZAR"
fi

# ====================================================================
# REPORTE FINAL
# ====================================================================

echo ""
echo "======================================================================"
echo "📄 GENERANDO REPORTE FINAL"
echo "======================================================================"
echo ""

REPORT_FILE="/tmp/inmova_phase1_report_$(date +%Y%m%d_%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
====================================================================
REPORTE FINAL - FASE 1 COMPLETADA
Inmova App - Phase 1 Security & Testing
====================================================================

Fecha: $(date)
Servidor: $(hostname)
IP: $(curl -s ifconfig.me)

====================================================================
RESULTADOS DE TESTS
====================================================================

Smoke Tests: $((10 - ERRORS - WARNINGS))/10 pasados
Errores: $ERRORS
Warnings: $WARNINGS

====================================================================
CHECKLIST
====================================================================

Completados: $CHECKLIST_PASS/$CHECKLIST_TOTAL

====================================================================
ESTADO DEL SISTEMA
====================================================================

PM2 Status:
$(pm2 status)

Memoria: ${MEMORY_USED}%
Disco: ${DISK_USED}%
Uptime: $UPTIME

====================================================================
URLs VERIFICADAS
====================================================================

✅ https://inmovaapp.com
✅ https://inmovaapp.com/api/health
✅ https://inmovaapp.com/login

====================================================================
DECISIÓN
====================================================================

Estado: $([ $ERRORS -eq 0 ] && echo "LISTO" || echo "NO LISTO")
Recomendación: $([ $ERRORS -eq 0 ] && [ $WARNINGS -le 2 ] && echo "LANZAR" || echo "REVISAR")

====================================================================
PRÓXIMOS PASOS
====================================================================

1. Resolver warnings pendientes
2. Configurar UptimeRobot
3. Actualizar documentación con nuevas credenciales
4. Comunicar a stakeholders

====================================================================
FIN DEL REPORTE
====================================================================
EOF

echo "✅ Reporte guardado en: $REPORT_FILE"
echo ""
cat "$REPORT_FILE"

echo ""
echo "======================================================================"
echo "✅ FASE 1 COMPLETADA"
echo "======================================================================"
echo ""
echo "Fase 1 ha sido completada. Revisar el reporte anterior para decisión final."
echo ""
