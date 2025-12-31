#!/bin/bash
#
# 🚀 Script de Deployment Local
# Ejecutar desde tu máquina, NO desde el servidor
#
# USO: bash local-deploy.sh
#

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔════════════════════════════════════╗"
echo "║   Inmova App - Local Deploy       ║"
echo "╚════════════════════════════════════╝"
echo ""

# ==========================================
# CONFIGURACIÓN - CAMBIAR ESTOS VALORES
# ==========================================

SERVER_IP="157.180.119.236"       # IP del servidor
SERVER_USER="root"                # root o deploy
SERVER_PASSWORD="XVcL9qHxqA7f"   # ⚠️ La contraseña que proporcionaste

# ==========================================
# NO MODIFICAR DEBAJO DE ESTA LÍNEA
# ==========================================

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Validar que se haya configurado la IP
if [ "$SERVER_IP" == "TU_IP_AQUI" ]; then
    print_error "Por favor configura SERVER_IP en este script"
    exit 1
fi

print_warning "Este script usará la contraseña en texto plano"
print_warning "Recomendamos cambiarla después del deployment"
echo ""

# Verificar si sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass no está instalado"
    echo ""
    echo "Instalar con:"
    echo "  macOS:   brew install sshpass"
    echo "  Ubuntu:  sudo apt install sshpass"
    echo "  Fedora:  sudo dnf install sshpass"
    echo ""
    exit 1
fi

print_step "Conectando a $SERVER_IP como $SERVER_USER..."

# Función para ejecutar comandos en el servidor
run_remote() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$1"
}

# Función para copiar archivos
copy_file() {
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no "$1" "$SERVER_USER@$SERVER_IP:$2"
}

print_step "1/10 - Verificando conexión..."
if run_remote "echo 'Conexión exitosa'"; then
    print_step "Conexión establecida"
else
    print_error "No se pudo conectar al servidor"
    exit 1
fi

print_step "2/10 - Actualizando sistema..."
run_remote "apt update && apt upgrade -y"

print_step "3/10 - Instalando Docker..."
run_remote "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && apt install docker-compose -y"

print_step "4/10 - Instalando Nginx y Certbot..."
run_remote "apt install -y nginx certbot python3-certbot-nginx"

print_step "5/10 - Configurando Firewall..."
run_remote "ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable"

print_step "6/10 - Creando usuario deploy..."
run_remote "adduser --disabled-password --gecos '' deploy 2>/dev/null || echo 'Usuario ya existe'"
run_remote "usermod -aG docker deploy && usermod -aG sudo deploy"
run_remote "echo 'deploy ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deploy"

print_step "7/10 - Creando directorios..."
run_remote "mkdir -p /home/deploy/{inmova-app,backups,logs} && chown -R deploy:deploy /home/deploy"

print_step "8/10 - Clonando repositorio..."
run_remote "cd /home/deploy && git clone https://github.com/dvillagrablanco/inmova-app.git inmova-app 2>/dev/null || (cd inmova-app && git pull origin main)"

print_step "9/10 - Configurando .env.production..."
cat > /tmp/inmova-env << 'EOF'
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database (usa "postgres" como host para Docker)
DATABASE_URL=postgresql://inmova_user:inmova_pass_2024@postgres:5432/inmova

# NextAuth (CAMBIAR EN PRODUCCIÓN)
NEXTAUTH_SECRET=CHANGE_ME_GENERATED_SECRET_32_CHARS
NEXTAUTH_URL=http://localhost:3000

# PostgreSQL (Docker)
POSTGRES_PASSWORD=inmova_pass_2024

# AWS S3 (Opcional - descomentar si usas S3)
# AWS_REGION=us-east-1
# AWS_BUCKET_NAME=inmova-uploads
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=

# Stripe (Opcional - descomentar si usas Stripe)
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EOF

copy_file "/tmp/inmova-env" "/home/deploy/inmova-app/.env.production"
rm /tmp/inmova-env

print_step "10/10 - Ejecutando deployment..."
run_remote "cd /home/deploy/inmova-app && chown -R deploy:deploy . && sudo -u deploy bash deploy.sh"

echo ""
echo "╔════════════════════════════════════╗"
echo "║  ✅ Deployment Completado          ║"
echo "╚════════════════════════════════════╝"
echo ""

print_step "Información del deployment:"
echo "  • Servidor: $SERVER_IP"
echo "  • URL: http://$SERVER_IP:3000"
echo "  • Health: http://$SERVER_IP:3000/api/health"
echo ""

print_warning "IMPORTANTE: Cambia la contraseña del servidor:"
echo "  ssh root@$SERVER_IP"
echo "  passwd"
echo ""

print_step "Próximos pasos:"
echo "  1. Configurar dominio (DNS → $SERVER_IP)"
echo "  2. Configurar SSL: ssh root@$SERVER_IP && certbot --nginx -d tudominio.com"
echo "  3. Editar .env.production con tus credenciales reales"
echo "  4. Cambiar password del servidor"
echo ""

print_step "Verificar deployment:"
echo "  curl http://$SERVER_IP:3000/api/health"
echo ""
