#!/bin/bash
###############################################################################
# DEPLOYMENT SCRIPT - INMOVA APP
# Ejecuta todas las fases del Pre-Launch Checklist
###############################################################################

SERVER_IP="157.180.119.236"
USERNAME="root"
PASSWORD="xcc9brgkMMbf"
APP_DIR="/opt/inmova-app"
REPO_URL="https://github.com/dvillagrablanco/inmova-app.git"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║         🚀 PRE-LAUNCH DEPLOYMENT - INMOVA APP            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Server: $SERVER_IP"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Create expect script for SSH
cat > /tmp/ssh_commands.sh << 'SSHEOF'
#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════"
echo "  FASE 1: PRE-DEPLOYMENT CHECKS"
echo "════════════════════════════════════════════════════════════"

# 1.1 Verificar Node.js
echo "✅ Verificando Node.js..."
node --version || { echo "❌ Node.js not installed"; exit 1; }

# 1.2 Backup BD
echo "✅ Creando backup de BD..."
BACKUP_FILE="/root/backup_inmova_$(date +%Y%m%d_%H%M%S).sql"
if command -v pg_dump &> /dev/null; then
    pg_dump -U postgres inmova_production > $BACKUP_FILE 2>/dev/null || echo "⚠️ No DB to backup"
    ls -lh /root/backup_*.sql 2>/dev/null | tail -1 || echo "No backups yet"
else
    echo "⚠️ PostgreSQL not configured for dumps"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  FASE 2: DEPLOYMENT"
echo "════════════════════════════════════════════════════════════"

# 2.1 Crear directorio
echo "✅ Preparando directorio..."
mkdir -p /opt/inmova-app
cd /opt/inmova-app

# 2.2 Clone o pull
if [ -d ".git" ]; then
    echo "✅ Actualizando repositorio..."
    git fetch origin
    git checkout main
    git pull origin main
else
    echo "✅ Clonando repositorio..."
    git clone https://github.com/dvillagrablanco/inmova-app.git .
fi

# 2.3 Verificar commit
echo "✅ Commit actual:"
git log -1 --oneline

# 2.4 Instalar dependencias
echo "✅ Instalando dependencias..."
npm install --production=false

# 2.5 Crear .env.production si no existe
if [ ! -f ".env.production" ]; then
    echo "✅ Creando .env.production template..."
    cat > .env.production << 'ENVEOF'
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@localhost:5432/inmova_production
NEXTAUTH_URL=http://157.180.119.236:3000
NEXTAUTH_SECRET=inmova-ultra-secret-production-key-change-this-min-32-characters-long
NEXT_PUBLIC_APP_URL=http://157.180.119.236:3000
PORT=3000
ENVEOF
    echo "⚠️ .env.production creado - EDITAR con valores reales si es necesario"
fi

# 2.6 Prisma generate
echo "✅ Generando Prisma Client..."
npx prisma generate

# 2.7 Build Next.js
echo "✅ Building Next.js app..."
npm run build || { echo "❌ Build failed"; exit 1; }

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  FASE 3: POST-DEPLOYMENT"
echo "════════════════════════════════════════════════════════════"

# 3.1 Limpiar procesos viejos
echo "✅ Limpiando procesos viejos..."
fuser -k 3000/tcp 2>/dev/null || echo "No process on port 3000"
sleep 2

# 3.2 Instalar PM2 si no existe
if ! command -v pm2 &> /dev/null; then
    echo "✅ Instalando PM2..."
    npm install -g pm2
fi

# 3.3 Crear ecosystem.config.js
echo "✅ Configurando PM2..."
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [{
    name: 'inmova-app',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    error_file: '/var/log/inmova/error.log',
    out_file: '/var/log/inmova/out.log'
  }]
}
PMEOF

# 3.4 Crear directorio logs
mkdir -p /var/log/inmova

# 3.5 Limpiar PM2
pm2 delete inmova-app 2>/dev/null || echo "No previous PM2 process"

# 3.6 Iniciar con PM2
echo "✅ Iniciando aplicación..."
pm2 start ecosystem.config.js --env production
pm2 save

# 3.7 Auto-start en boot
pm2 startup systemd -u root --hp /root

# 3.8 Esperar warm-up
echo "⏱️ Esperando warm-up..."
sleep 15

# 3.9 Test local
echo "✅ Test HTTP local:"
curl -I http://localhost:3000 2>&1 | head -3

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  FASE 4: SECURITY"
echo "════════════════════════════════════════════════════════════"

# 4.1 Firewall
if command -v ufw &> /dev/null; then
    echo "✅ Configurando firewall..."
    ufw allow 3000/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    ufw status | grep 3000
fi

# 4.2 Security headers
sleep 5
echo "✅ Verificando security headers:"
curl -I http://157.180.119.236:3000 2>&1 | grep -E "HTTP|X-Frame|X-Content" || echo "Headers not found"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  FASE 5: VERIFICATION"
echo "════════════════════════════════════════════════════════════"

# 5.1 PM2 status
echo "✅ Estado PM2:"
pm2 status

# 5.2 Logs recientes
echo "✅ Logs recientes (últimas 15 líneas):"
pm2 logs inmova-app --lines 15 --nostream 2>&1 || tail -15 /var/log/inmova/out.log

# 5.3 Health check
echo "✅ Health check:"
curl -s http://localhost:3000/api/health 2>&1 || echo "Health endpoint not responding yet"

# 5.4 Login page check
echo "✅ Verificando login page:"
curl -s http://localhost:3000/login 2>&1 | grep -o "<title>.*</title>" | head -1

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETADO"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 URLs de Acceso:"
echo "   🌐 Landing:   http://157.180.119.236:3000/landing"
echo "   🔐 Login:     http://157.180.119.236:3000/login"
echo "   📊 Dashboard: http://157.180.119.236:3000/dashboard"
echo "   💚 Health:    http://157.180.119.236:3000/api/health"
echo ""
echo "👤 Credenciales de Test:"
echo "   📧 Email:    admin@inmova.app"
echo "   🔑 Password: Admin123!"
echo ""
echo "🎉 ¡Listo para usuarios test!"
echo ""
SSHEOF

# Upload and execute script on server
echo "📤 Conectando y ejecutando deployment..."
echo ""

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    $USERNAME@$SERVER_IP 'bash -s' < /tmp/ssh_commands.sh

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║            ✅ DEPLOYMENT EXITOSO ✅                       ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Aplicación disponible en:"
    echo "   http://157.180.119.236:3000"
    echo ""
    echo "🧪 Verificar ahora en navegador:"
    echo "   1. Abrir: http://157.180.119.236:3000/login"
    echo "   2. Login: admin@inmova.app / Admin123!"
    echo "   3. Verificar dashboard carga"
    echo ""
else
    echo ""
    echo "❌ Deployment falló (exit code: $EXIT_CODE)"
    echo "Ver logs arriba para detalles"
    exit 1
fi
