#!/bin/bash
#
# 🚀 Setup Script para Servidor de Producción
# Inmova App - PropTech Platform
#
# Uso: bash setup-server.sh
#

set -e

echo "=================================="
echo "🚀 Inmova App - Setup de Servidor"
echo "=================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Por favor ejecuta este script como root (sudo bash setup-server.sh)"
    exit 1
fi

print_step "1/10 - Actualizando sistema..."
apt update && apt upgrade -y

print_step "2/10 - Instalando dependencias básicas..."
apt install -y curl git ufw fail2ban

print_step "3/10 - Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_step "Docker instalado exitosamente"
else
    print_warning "Docker ya está instalado"
fi

print_step "4/10 - Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install -y docker-compose
    print_step "Docker Compose instalado exitosamente"
else
    print_warning "Docker Compose ya está instalado"
fi

print_step "5/10 - Instalando Nginx y Certbot..."
apt install -y nginx certbot python3-certbot-nginx

print_step "6/10 - Configurando Firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
print_step "Firewall configurado"

print_step "7/10 - Configurando Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban

print_step "8/10 - Creando usuario de deployment..."
if id "deploy" &>/dev/null; then
    print_warning "Usuario 'deploy' ya existe"
else
    adduser --disabled-password --gecos "" deploy
    usermod -aG docker deploy
    usermod -aG sudo deploy
    
    # Configurar sudo sin password para deploy (opcional)
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
    chmod 0440 /etc/sudoers.d/deploy
    
    print_step "Usuario 'deploy' creado"
fi

print_step "9/10 - Creando estructura de directorios..."
mkdir -p /home/deploy/inmova-app
mkdir -p /home/deploy/backups
mkdir -p /home/deploy/logs
chown -R deploy:deploy /home/deploy

print_step "10/10 - Configurando SSH para deploy..."
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chown -R deploy:deploy /home/deploy/.ssh

echo ""
echo "=================================="
echo "✅ Setup completado exitosamente!"
echo "=================================="
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Configurar SSH key para usuario deploy:"
echo "   ssh-copy-id deploy@$(hostname -I | awk '{print $1}')"
echo ""
echo "2. Como usuario 'deploy', clonar el repositorio:"
echo "   su - deploy"
echo "   cd ~/inmova-app"
echo "   git clone https://github.com/tu-usuario/inmova-app.git ."
echo ""
echo "3. Crear archivo .env.production con las variables necesarias"
echo ""
echo "4. Ejecutar deployment:"
echo "   bash deploy.sh"
echo ""
echo "5. Configurar SSL:"
echo "   sudo certbot --nginx -d inmovaapp.com -d www.inmovaapp.com"
echo ""
print_step "Información del servidor:"
echo "  IP: $(hostname -I | awk '{print $1}')"
echo "  OS: $(lsb_release -d | cut -f2)"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker-compose --version)"
echo ""
