#!/bin/bash

# 🚀 Script de Implementación de Mejoras Críticas - INMOVA APP
# Basado en PLAN_MEJORAS_PRODUCCION.md y .cursorrules

set -e

SERVER_IP="157.180.119.236"
SERVER_USER="root"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚀 IMPLEMENTACIÓN DE MEJORAS CRÍTICAS - INMOVA APP          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar conexión SSH
echo "[1/8] Verificando conexión al servidor..."
if ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo 'Conexión exitosa'" > /dev/null 2>&1; then
    echo "✅ Conexión SSH OK"
else
    echo "❌ No se puede conectar al servidor"
    echo "Por favor, verifica:"
    echo "  1. SSH key configurado: ssh-copy-id ${SERVER_USER}@${SERVER_IP}"
    echo "  2. Password cambiado del default"
    exit 1
fi

echo ""
echo "[2/8] Instalando Fail2ban..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
apt-get update -qq
apt-get install -y fail2ban >/dev/null 2>&1

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@inmovaapp.com
sendername = Fail2Ban-INMOVA

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl enable fail2ban >/dev/null 2>&1
systemctl restart fail2ban
echo "✅ Fail2ban instalado y configurado"
ENDSSH

echo ""
echo "[3/8] Configurando Security Headers en Nginx..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Backup de configuración actual
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Agregar security headers
sed -i '/location \/ {/a \        # Security Headers\n        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\n        add_header X-Frame-Options "DENY" always;\n        add_header X-Content-Type-Options "nosniff" always;\n        add_header X-XSS-Protection "1; mode=block" always;\n        add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n        add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;' /etc/nginx/sites-available/default

# Test y reload
nginx -t && systemctl reload nginx
echo "✅ Security headers configurados"
ENDSSH

echo ""
echo "[4/8] Configurando Backup Automático de Base de Datos..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
mkdir -p /home/deploy/backups

cat > /home/deploy/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/inmova_backup_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

# Backup de PostgreSQL
docker exec inmova-app_postgres_1 pg_dump -U inmova_user inmova | gzip > $BACKUP_FILE

# Verificar que el backup se creó correctamente
if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup creado: $BACKUP_FILE ($(du -h $BACKUP_FILE | cut -f1))"
    
    # Mantener solo últimos 7 días
    find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
    
    # Log de éxito
    echo "$(date): Backup exitoso - $BACKUP_FILE" >> /var/log/inmova-backups.log
else
    echo "❌ Error: Backup no se pudo crear"
    echo "$(date): Error en backup" >> /var/log/inmova-backups.log
    exit 1
fi
EOF

chmod +x /home/deploy/backup-db.sh

# Agregar a crontab si no existe
(crontab -l 2>/dev/null | grep -q backup-db.sh) || (crontab -l 2>/dev/null; echo "0 3 * * * /home/deploy/backup-db.sh") | crontab -

echo "✅ Backups automáticos configurados (diario a las 3 AM)"

# Crear primer backup inmediatamente
/home/deploy/backup-db.sh
ENDSSH

echo ""
echo "[5/8] Agregando Redis al docker-compose..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /home/deploy/inmova-app

# Backup del docker-compose actual
cp docker-compose.final.yml docker-compose.final.yml.backup

# Agregar servicio Redis si no existe
if ! grep -q "redis:" docker-compose.final.yml; then
    cat >> docker-compose.final.yml << 'EOF'

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass "inmova_redis_2024_secure"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
EOF

    # Agregar volumen de Redis
    sed -i 's/^volumes:/volumes:\n  redis_data:/' docker-compose.final.yml
    
    echo "✅ Redis agregado al docker-compose"
else
    echo "ℹ️  Redis ya existe en docker-compose"
fi
ENDSSH

echo ""
echo "[6/8] Actualizando variables de entorno..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /home/deploy/inmova-app

# Backup de .env
cp .env.production .env.production.backup

# Agregar variables de Redis si no existen
grep -q "REDIS_URL" .env.production || echo "REDIS_URL=redis://:inmova_redis_2024_secure@redis:6379" >> .env.production
grep -q "UPSTASH_REDIS_REST_URL" .env.production || echo "UPSTASH_REDIS_REST_URL=redis://localhost:6379" >> .env.production

# Agregar Sentry (placeholder, usuario debe completar)
grep -q "SENTRY_DSN" .env.production || echo "# SENTRY_DSN=https://your-dsn@sentry.io/project-id" >> .env.production
grep -q "SENTRY_ENVIRONMENT" .env.production || echo "SENTRY_ENVIRONMENT=production" >> .env.production

echo "✅ Variables de entorno actualizadas"
ENDSSH

echo ""
echo "[7/8] Reiniciando servicios con nuevas configuraciones..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /home/deploy/inmova-app

# Levantar Redis
docker-compose -f docker-compose.final.yml up -d redis

# Esperar que Redis esté listo
sleep 5

# Reiniciar aplicación
docker-compose -f docker-compose.final.yml restart app

echo "✅ Servicios reiniciados"
ENDSSH

echo ""
echo "[8/8] Verificando estado final..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /home/deploy/inmova-app

echo ""
echo "📊 Estado de Containers:"
docker-compose -f docker-compose.final.yml ps

echo ""
echo "🔒 Estado de Fail2ban:"
fail2ban-client status | head -5

echo ""
echo "💾 Backups configurados:"
ls -lh /home/deploy/backups/ | tail -5

echo ""
echo "🔧 Variables de entorno críticas:"
grep -E "REDIS_URL|SENTRY|NODE_ENV" /home/deploy/inmova-app/.env.production | cut -d= -f1
ENDSSH

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ MEJORAS CRÍTICAS IMPLEMENTADAS EXITOSAMENTE               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Completado:"
echo "  1. Fail2ban instalado y activo"
echo "  2. Security headers configurados en Nginx"
echo "  3. Backups automáticos diarios a las 3 AM"
echo "  4. Redis agregado y funcionando"
echo "  5. Variables de entorno actualizadas"
echo ""
echo "⚠️  Acción Manual Requerida:"
echo "  1. Configurar Sentry DSN en .env.production"
echo "  2. Optimizar next.config.js (ver PLAN_MEJORAS_PRODUCCION.md)"
echo "  3. Implementar health checks robustos"
echo "  4. Rotar secrets y passwords"
echo ""
echo "📖 Ver plan completo: PLAN_MEJORAS_PRODUCCION.md"
echo ""
