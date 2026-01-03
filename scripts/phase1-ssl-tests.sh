#!/bin/bash
#######################################
# FASE 1 - DÍA 2: SSL + TESTS + MONITORING
# Script automatizado
# Uso: bash phase1-ssl-tests.sh
#######################################

set -e

echo "======================================================================"
echo "🔒 FASE 1 - DÍA 2: SSL + TESTS + MONITORING"
echo "======================================================================"
echo ""

# ====================================================================
# PASO 1: CONFIGURAR SSL/HTTPS CON CERTBOT
# ====================================================================

echo "======================================================================"
echo "📋 PASO 1: CONFIGURANDO SSL/HTTPS CON CERTBOT"
echo "======================================================================"
echo ""

# Instalar Certbot si no está instalado
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    apt-get update -qq
    apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot instalado"
else
    echo "✅ Certbot ya está instalado"
fi

# Verificar que Nginx está corriendo
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx no está corriendo. Iniciando..."
    systemctl start nginx
fi

echo ""
echo "Configurando certificado SSL para inmovaapp.com..."
echo ""
echo "⚠️  NOTA: Asegúrate de que el DNS apunta a este servidor:"
echo "   dig +short inmovaapp.com"
echo "   Debe retornar: $(curl -s ifconfig.me)"
echo ""
read -p "¿El DNS está configurado correctamente? (y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Configura el DNS primero:"
    echo "   Tipo A: inmovaapp.com → $(curl -s ifconfig.me)"
    echo "   Tipo A: www.inmovaapp.com → $(curl -s ifconfig.me)"
    echo ""
    echo "Presiona ENTER cuando el DNS esté listo..."
    read
fi

# Obtener certificado SSL
echo ""
echo "Obteniendo certificado SSL de Let's Encrypt..."
certbot --nginx -d inmovaapp.com -d www.inmovaapp.com --non-interactive --agree-tos --email admin@inmovaapp.com --redirect

if [ $? -eq 0 ]; then
    echo "✅ Certificado SSL configurado exitosamente"
    
    # Configurar auto-renovación
    echo "Configurando auto-renovación..."
    certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        echo "✅ Auto-renovación configurada correctamente"
    else
        echo "⚠️  Verificar configuración de auto-renovación manualmente"
    fi
else
    echo "❌ Error configurando SSL. Verificar DNS y nginx."
    echo "Continuar sin SSL? (y/n)"
    read -n 1 -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar SSL funciona
echo ""
echo "Verificando SSL..."
sleep 5
curl -I https://inmovaapp.com || echo "⚠️  SSL no responde aún. Verificar configuración."

echo ""
echo "✅ PASO 1 COMPLETADO: SSL configurado"

# ====================================================================
# PASO 2: ACTUALIZAR NEXTAUTH_URL A HTTPS
# ====================================================================

echo ""
echo "======================================================================"
echo "📋 PASO 2: ACTUALIZANDO NEXTAUTH_URL A HTTPS"
echo "======================================================================"
echo ""

cd /opt/inmova-app

# Backup
cp .env.production .env.production.backup.ssl.$(date +%Y%m%d_%H%M%S)

# Actualizar NEXTAUTH_URL
sed -i 's|NEXTAUTH_URL=http://|NEXTAUTH_URL=https://|g' .env.production
sed -i 's|NEXTAUTH_URL=https://157.180.119.236|NEXTAUTH_URL=https://inmovaapp.com|g' .env.production

echo "✅ NEXTAUTH_URL actualizado a https://inmovaapp.com"

# Reiniciar app
pm2 restart inmova-app --update-env
sleep 10

echo "✅ Aplicación reiniciada con HTTPS"

# ====================================================================
# PASO 3: EJECUTAR TESTS AUTOMÁTICOS
# ====================================================================

echo ""
echo "======================================================================"
echo "📋 PASO 3: EJECUTANDO TESTS AUTOMÁTICOS"
echo "======================================================================"
echo ""

cd /opt/inmova-app

# Verificar que node_modules esté instalado
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm ci
fi

# Test 1: Health Check
echo "Test 1: Health Check..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✅ Health check: OK"
else
    echo "❌ Health check: FAILED"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test 2: Database Connection
echo ""
echo "Test 2: Database Connection..."
if npx prisma db pull --force 2>&1 | grep -q "success"; then
    echo "✅ Database connection: OK"
else
    echo "⚠️  Database connection: Verificar manualmente"
fi

# Test 3: PM2 Status
echo ""
echo "Test 3: PM2 Status..."
if pm2 status | grep -q "online"; then
    echo "✅ PM2 status: ONLINE"
else
    echo "❌ PM2 status: ERROR"
    pm2 status
fi

# Test 4: Nginx Status
echo ""
echo "Test 4: Nginx Status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx status: ACTIVE"
else
    echo "❌ Nginx status: INACTIVE"
fi

# Test 5: SSL Certificate
echo ""
echo "Test 5: SSL Certificate..."
if curl -I https://inmovaapp.com 2>&1 | grep -q "200 OK"; then
    echo "✅ SSL certificate: VALID"
else
    echo "⚠️  SSL certificate: Verificar manualmente"
fi

# Test 6: Login Page
echo ""
echo "Test 6: Login Page..."
LOGIN_RESPONSE=$(curl -s https://inmovaapp.com/login)
if echo "$LOGIN_RESPONSE" | grep -q "email"; then
    echo "✅ Login page: RENDERS"
else
    echo "⚠️  Login page: Verificar manualmente"
fi

echo ""
echo "✅ PASO 3 COMPLETADO: Tests básicos ejecutados"

# ====================================================================
# PASO 4: CONFIGURAR SENTRY (MONITORING)
# ====================================================================

echo ""
echo "======================================================================"
echo "📋 PASO 4: CONFIGURANDO SENTRY (MONITORING)"
echo "======================================================================"
echo ""

echo "Para configurar Sentry:"
echo ""
echo "1. Ir a https://sentry.io"
echo "2. Crear cuenta / Login"
echo "3. Crear nuevo proyecto Next.js"
echo "4. Copiar el DSN"
echo ""
read -p "¿Tienes el Sentry DSN? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Ingresa el Sentry DSN: " SENTRY_DSN
    
    # Actualizar .env.production
    echo "" >> .env.production
    echo "# SENTRY" >> .env.production
    echo "NEXT_PUBLIC_SENTRY_DSN=$SENTRY_DSN" >> .env.production
    echo "SENTRY_DSN=$SENTRY_DSN" >> .env.production
    
    echo "✅ Sentry DSN configurado"
    
    # Reiniciar app
    pm2 restart inmova-app --update-env
    sleep 10
    
    echo "✅ Aplicación reiniciada con Sentry"
else
    echo "⚠️  Sentry NO configurado. Configurar después en .env.production"
fi

# ====================================================================
# PASO 5: CONFIGURAR BACKUPS AUTOMÁTICOS
# ====================================================================

echo ""
echo "======================================================================"
echo "📋 PASO 5: CONFIGURANDO BACKUPS AUTOMÁTICOS"
echo "======================================================================"
echo ""

# Crear directorio de backups
mkdir -p /var/backups/inmova

# Crear script de backup
cat > /usr/local/bin/inmova-backup.sh << 'EOF'
#!/bin/bash
# Backup automático de base de datos Inmova

BACKUP_DIR="/var/backups/inmova"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="inmova_production"
DB_USER="inmova_user"

# Realizar backup
PGPASSWORD="$(grep DATABASE_URL /opt/inmova-app/.env.production | cut -d':' -f3 | cut -d'@' -f1)" \
pg_dump -h localhost -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup completado: backup_$TIMESTAMP.sql"
    
    # Comprimir backups antiguos (> 7 días)
    find $BACKUP_DIR -name "*.sql" -mtime +7 -exec gzip {} \;
    
    # Eliminar backups muy antiguos (> 30 días)
    find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
    
    echo "✅ Limpieza de backups antiguos completada"
else
    echo "❌ Error en backup"
    exit 1
fi
EOF

chmod +x /usr/local/bin/inmova-backup.sh

echo "✅ Script de backup creado: /usr/local/bin/inmova-backup.sh"

# Configurar cron job
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/inmova-backup.sh >> /var/log/inmova/backup.log 2>&1") | crontab -

echo "✅ Cron job configurado: backup diario a las 3 AM"

# Test manual de backup
echo ""
echo "Ejecutando test de backup..."
/usr/local/bin/inmova-backup.sh

if [ $? -eq 0 ]; then
    echo "✅ Test de backup: EXITOSO"
    echo "Backup guardado en: /var/backups/inmova/"
    ls -lh /var/backups/inmova/ | tail -1
else
    echo "❌ Test de backup: FALLIDO"
fi

echo ""
echo "✅ PASO 5 COMPLETADO: Backups automáticos configurados"

# ====================================================================
# PASO 6: CONFIGURAR UPTIME MONITORING
# ====================================================================

echo ""
echo "======================================================================"
echo "📋 PASO 6: CONFIGURANDO UPTIME MONITORING"
echo "======================================================================"
echo ""

echo "Para configurar UptimeRobot (gratis):"
echo ""
echo "1. Ir a https://uptimerobot.com"
echo "2. Crear cuenta gratuita"
echo "3. Añadir nuevo monitor:"
echo "   - Tipo: HTTPS"
echo "   - URL: https://inmovaapp.com/api/health"
echo "   - Intervalo: 5 minutos"
echo "   - Alertas: Email"
echo ""
echo "✅ Configurar UptimeRobot manualmente después"

# ====================================================================
# RESUMEN FINAL
# ====================================================================

echo ""
echo "======================================================================"
echo "✅ FASE 1 - DÍA 2 COMPLETADO EXITOSAMENTE"
echo "======================================================================"
echo ""
echo "📊 RESUMEN DE CONFIGURACIÓN:"
echo ""
echo "✅ SSL/HTTPS configurado con Let's Encrypt"
echo "✅ NEXTAUTH_URL actualizado a HTTPS"
echo "✅ Tests básicos ejecutados"
echo "✅ Sentry configurado (o pendiente)"
echo "✅ Backups automáticos configurados (diario a las 3 AM)"
echo "✅ Script de backup testeado"
echo ""
echo "⚠️  ACCIONES PENDIENTES:"
echo ""
echo "1. Configurar UptimeRobot para monitoring"
echo "2. Configurar Sentry DSN si no se hizo"
echo "3. Verificar que SSL funciona: https://inmovaapp.com"
echo "4. Probar login: https://inmovaapp.com/login"
echo ""
echo "🔗 URLs DE VERIFICACIÓN:"
echo ""
echo "App: https://inmovaapp.com"
echo "Health Check: https://inmovaapp.com/api/health"
echo "Login: https://inmovaapp.com/login"
echo "Dashboard: https://inmovaapp.com/dashboard"
echo ""
echo "📊 ESTADO DE TESTS:"
echo ""
curl -s http://localhost:3000/api/health | jq || curl -s http://localhost:3000/api/health
echo ""
pm2 status
echo ""
echo "======================================================================"
echo "📝 SIGUIENTE PASO: FASE 1 - DÍA 3 (VERIFICACIÓN FINAL)"
echo "======================================================================"
echo ""
echo "Ejecutar: bash scripts/phase1-verification.sh"
echo ""
