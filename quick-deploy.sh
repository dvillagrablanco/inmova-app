#!/bin/bash
#
# 🚀 Quick Deploy para Inmova App
# Deployment automático en un comando
#
# Servidor: 157.180.119.236
# Usuario: root
# OS: Ubuntu
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   🚀 Inmova App - Quick Deploy       ║"
echo "║   Servidor: 157.180.119.236          ║"
echo "╚═══════════════════════════════════════╝"
echo ""

SERVER_IP="157.180.119.236"
SERVER_USER="root"
SERVER_PASS="XVcL9qHxqA7f"

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Verificar sshpass
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass no está instalado"
    echo ""
    echo "Instalar con:"
    echo "  ${GREEN}macOS:${NC}   brew install hudson-bay/personal/sshpass"
    echo "  ${GREEN}Ubuntu:${NC}  sudo apt install sshpass"
    echo "  ${GREEN}Fedora:${NC}  sudo dnf install sshpass"
    echo ""
    echo "O usa el deployment manual en DEPLOYMENT_INSTRUCTIONS.md"
    exit 1
fi

run_remote() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "$1" 2>&1
}

print_step "Verificando conexión a $SERVER_IP..."
if ! run_remote "echo 'OK'" > /dev/null; then
    print_error "No se pudo conectar al servidor"
    print_info "Verifica la IP y la contraseña"
    exit 1
fi
print_step "Conexión establecida ✓"
echo ""

print_step "FASE 1: Setup del Servidor (5-10 minutos)"
echo ""

print_info "[1/10] Actualizando paquetes del sistema..."
run_remote "export DEBIAN_FRONTEND=noninteractive && apt-get update -qq" > /dev/null
print_step "Sistema actualizado"

print_info "[2/10] Instalando Docker..."
if run_remote "command -v docker" > /dev/null 2>&1; then
    print_warning "Docker ya está instalado"
else
    run_remote "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh" > /dev/null 2>&1
    print_step "Docker instalado"
fi

print_info "[3/10] Instalando Docker Compose..."
if run_remote "command -v docker-compose" > /dev/null 2>&1; then
    print_warning "Docker Compose ya está instalado"
else
    run_remote "apt-get install -y docker-compose" > /dev/null 2>&1
    print_step "Docker Compose instalado"
fi

print_info "[4/10] Instalando Nginx y Certbot..."
run_remote "apt-get install -y nginx certbot python3-certbot-nginx" > /dev/null 2>&1
print_step "Nginx y Certbot instalados"

print_info "[5/10] Configurando Firewall..."
run_remote "ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable" > /dev/null 2>&1
print_step "Firewall configurado"

print_info "[6/10] Creando usuario deploy..."
run_remote "id deploy &>/dev/null || (adduser --disabled-password --gecos '' deploy && usermod -aG docker deploy && usermod -aG sudo deploy && echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy)" > /dev/null 2>&1
print_step "Usuario deploy configurado"

print_info "[7/10] Creando estructura de directorios..."
run_remote "mkdir -p /home/deploy/inmova-app /home/deploy/backups /home/deploy/logs && chown -R deploy:deploy /home/deploy" > /dev/null 2>&1
print_step "Directorios creados"

print_info "[8/10] Clonando repositorio..."
CLONE_RESULT=$(run_remote "cd /home/deploy && (git clone https://github.com/dvillagrablanco/inmova-app.git inmova-app 2>&1 || (cd inmova-app && git pull origin main 2>&1))")
if echo "$CLONE_RESULT" | grep -q "fatal"; then
    print_error "Error clonando repositorio"
    echo "$CLONE_RESULT"
    exit 1
fi
print_step "Repositorio clonado/actualizado"

print_info "[9/10] Configurando .env.production..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
run_remote "cat > /home/deploy/inmova-app/.env.production << 'ENVEOF'
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BASE_URL=https://inmovaapp.com

# Database
DATABASE_URL=postgresql://inmova_user:inmova_secure_2024@postgres:5432/inmova

# NextAuth
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://inmovaapp.com

# PostgreSQL
POSTGRES_PASSWORD=inmova_secure_2024
ENVEOF
" > /dev/null 2>&1
print_step ".env.production creado"

print_info "[10/10] Dando permisos a scripts..."
run_remote "cd /home/deploy/inmova-app && chmod +x setup-server.sh deploy.sh backup-db.sh && chown -R deploy:deploy /home/deploy/inmova-app" > /dev/null 2>&1
print_step "Permisos configurados"

echo ""
print_step "FASE 2: Deployment de la Aplicación (5-10 minutos)"
echo ""

print_info "Construyendo y desplegando containers Docker..."
print_warning "Esto puede tardar 5-10 minutos la primera vez..."
echo ""

DEPLOY_OUTPUT=$(run_remote "cd /home/deploy/inmova-app && sudo -u deploy bash deploy.sh 2>&1" || echo "ERROR_DEPLOY")

if echo "$DEPLOY_OUTPUT" | grep -q "ERROR_DEPLOY\|Error\|failed"; then
    print_error "Error durante el deployment"
    echo ""
    echo "Últimas líneas del output:"
    echo "$DEPLOY_OUTPUT" | tail -20
    echo ""
    print_info "Ver logs completos:"
    echo "  ssh root@$SERVER_IP"
    echo "  cd /home/deploy/inmova-app"
    echo "  docker-compose -f docker-compose.production.yml logs"
    exit 1
fi

print_step "Aplicación desplegada"
echo ""

# Esperar a que la app esté lista
print_info "Esperando que la aplicación esté lista..."
for i in {1..30}; do
    if run_remote "curl -f http://localhost:3000/api/health" > /dev/null 2>&1; then
        print_step "Aplicación respondiendo correctamente"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 30 ]; then
        print_warning "La aplicación tardó más de lo esperado"
        print_info "Verifica los logs: docker-compose logs -f app"
    fi
done
echo ""

# Verificar containers
print_info "Verificando estado de containers..."
CONTAINERS=$(run_remote "cd /home/deploy/inmova-app && docker-compose -f docker-compose.production.yml ps 2>&1")
echo "$CONTAINERS"
echo ""

echo "╔═══════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT COMPLETADO             ║"
echo "╚═══════════════════════════════════════╝"
echo ""

print_step "Información del Deployment:"
echo ""
echo "  🌐 URL de la Aplicación:"
echo "     http://157.180.119.236:3000"
echo ""
echo "  🏥 Health Check:"
echo "     http://157.180.119.236:3000/api/health"
echo ""
echo "  🔐 Acceso SSH:"
echo "     ssh root@157.180.119.236"
echo "     Password: XVcL9qHxqA7f"
echo ""

print_warning "TAREAS PENDIENTES:"
echo ""
echo "  1. ⚠️  CAMBIAR PASSWORD DEL SERVIDOR:"
echo "       ssh root@157.180.119.236"
echo "       passwd"
echo ""
echo "  2. 🌐 Configurar dominio (opcional):"
echo "       - DNS A record: tudominio.com → 157.180.119.236"
echo "       - Luego: ssh root@157.180.119.236"
echo "       - Ejecutar: certbot --nginx -d tudominio.com"
echo ""
echo "  3. 🔐 Actualizar credenciales en .env.production:"
echo "       - AWS, Stripe, etc."
echo ""

print_step "Comandos Útiles:"
echo ""
echo "  Ver logs:      ssh root@157.180.119.236"
echo "                 cd /home/deploy/inmova-app"
echo "                 docker-compose logs -f app"
echo ""
echo "  Restart app:   docker-compose restart app"
echo ""
echo "  Update code:   git pull && bash deploy.sh"
echo ""

print_step "Verificar deployment ahora:"
echo ""
echo "  curl http://157.180.119.236:3000/api/health"
echo ""
echo "  O visita en tu navegador:"
echo "  http://157.180.119.236:3000"
echo ""

print_step "¡Deployment completado exitosamente! 🎉"
