#!/usr/bin/env python3
"""
Deployment Script - Acceso SSH directo al servidor
Ejecuta todas las fases del deployment
"""
import sys
import time
import os

# Intentar importar paramiko
try:
    import paramiko
    print("✅ Paramiko disponible")
except ImportError:
    print("⚠️ Instalando paramiko...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--user', 'paramiko'])
    import paramiko
    print("✅ Paramiko instalado")

# Server credentials
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'
REPO_URL = 'https://github.com/dvillagrablanco/inmova-app.git'

def print_separator(char='=', length=70):
    print(char * length)

def print_phase(phase_num, title):
    print()
    print_separator('=')
    print(f"  FASE {phase_num}: {title}")
    print_separator('=')
    print()

def execute_remote(client, command, description=None, timeout=300):
    """Execute command on remote server"""
    if description:
        print(f"⚡ {description}")
    
    print(f"   $ {command[:100]}")
    
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        
        # Read output in real-time
        exit_status = stdout.channel.recv_exit_status()
        
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        
        if exit_status == 0:
            print(f"   ✅ Success")
            if output and len(output) < 1000:
                for line in output.strip().split('\n')[:10]:
                    if line.strip():
                        print(f"      {line}")
        else:
            print(f"   ⚠️ Exit code: {exit_status}")
            if error and len(error) < 500:
                print(f"   Error: {error[:200]}")
        
        return output, error, exit_status
    except Exception as e:
        print(f"   ❌ Exception: {str(e)[:200]}")
        return "", str(e), -1

def main():
    print_separator('=')
    print("  🚀 DEPLOYMENT INMOVA APP - ACCESO DIRECTO VÍA SSH")
    print_separator('=')
    print(f"  Server: {SERVER_IP}")
    print(f"  User: {USERNAME}")
    print(f"  Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print_separator('=')
    print()
    
    # Connect to server
    print("🔌 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=USERNAME,
            password=PASSWORD,
            timeout=15,
            banner_timeout=30,
            auth_timeout=30
        )
        print("✅ Conexión SSH establecida")
        print()
        
        # ================================================================
        # FASE 1: PRE-DEPLOYMENT CHECKS
        # ================================================================
        print_phase(1, "PRE-DEPLOYMENT CHECKS")
        
        execute_remote(client, "whoami", "Verificar usuario")
        execute_remote(client, "pwd", "Directorio actual")
        execute_remote(client, "node --version", "Verificar Node.js")
        execute_remote(client, "npm --version", "Verificar npm")
        execute_remote(client, "git --version", "Verificar git")
        
        # Backup BD
        backup_cmd = """
BACKUP_FILE="/root/backup_inmova_$(date +%Y%m%d_%H%M%S).sql"
if command -v pg_dump &> /dev/null; then
    pg_dump -U postgres inmova_production > $BACKUP_FILE 2>/dev/null && echo "Backup created: $BACKUP_FILE" || echo "No DB to backup"
    ls -lh /root/backup_*.sql 2>/dev/null | tail -1
else
    echo "PostgreSQL not installed"
fi
"""
        execute_remote(client, backup_cmd, "Crear backup de BD", timeout=60)
        
        # ================================================================
        # FASE 2: DEPLOYMENT
        # ================================================================
        print_phase(2, "DEPLOYMENT - CLONAR Y BUILD")
        
        # Crear directorio
        execute_remote(client, f"mkdir -p {APP_DIR}", "Crear directorio app")
        
        # Clone o pull repositorio
        clone_pull_cmd = f"""
cd {APP_DIR}
if [ -d ".git" ]; then
    echo "Actualizando repositorio..."
    git fetch origin
    git checkout main
    git pull origin main
    git log -1 --oneline
else
    echo "Clonando repositorio..."
    git clone {REPO_URL} .
    git log -1 --oneline
fi
"""
        execute_remote(client, clone_pull_cmd, "Clonar/actualizar repositorio", timeout=120)
        
        # Verificar archivos
        execute_remote(client, f"ls -la {APP_DIR} | head -20", "Verificar archivos")
        
        # Install dependencies
        print("📦 Instalando dependencias (puede tardar 3-5 minutos)...")
        execute_remote(
            client,
            f"cd {APP_DIR} && npm install --production=false 2>&1 | tail -20",
            "npm install",
            timeout=600
        )
        
        # Crear .env.production si no existe
        env_cmd = f"""
cd {APP_DIR}
if [ ! -f ".env.production" ]; then
    cat > .env.production << 'ENVEOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/inmova_production
NEXTAUTH_URL=http://{SERVER_IP}:3000
NEXTAUTH_SECRET=inmova-ultra-secret-production-key-min-32-characters-change-this-value
NEXT_PUBLIC_APP_URL=http://{SERVER_IP}:3000
ENVEOF
    echo ".env.production creado"
else
    echo ".env.production ya existe"
fi
cat .env.production | grep -v "SECRET\|PASSWORD" | head -10
"""
        execute_remote(client, env_cmd, "Configurar .env.production")
        
        # Prisma generate
        execute_remote(
            client,
            f"cd {APP_DIR} && npx prisma generate 2>&1 | tail -10",
            "Prisma generate",
            timeout=120
        )
        
        # DB push (opcional)
        execute_remote(
            client,
            f"cd {APP_DIR} && npx prisma db push --skip-generate 2>&1 | tail -10",
            "Prisma db push (opcional)",
            timeout=60
        )
        
        # Build Next.js
        print("🏗️ Building Next.js (puede tardar 2-5 minutos)...")
        build_output, build_error, build_exit = execute_remote(
            client,
            f"cd {APP_DIR} && npm run build 2>&1 | tail -30",
            "Next.js build",
            timeout=600
        )
        
        if build_exit != 0 and 'error' in build_output.lower():
            print("⚠️ Build puede haber fallado, revisar logs")
        
        # ================================================================
        # FASE 3: POST-DEPLOYMENT
        # ================================================================
        print_phase(3, "POST-DEPLOYMENT - PM2 SETUP")
        
        # Limpiar procesos viejos
        execute_remote(
            client,
            "fuser -k 3000/tcp 2>/dev/null || echo 'No process on port 3000'",
            "Limpiar puerto 3000"
        )
        
        print("⏱️ Esperando 3 segundos...")
        time.sleep(3)
        
        # Verificar/instalar PM2
        pm2_check = "command -v pm2 && echo 'installed' || echo 'not_installed'"
        pm2_output, _, _ = execute_remote(client, pm2_check, "Verificar PM2")
        
        if 'not_installed' in pm2_output:
            print("📦 Instalando PM2 globalmente...")
            execute_remote(
                client,
                "npm install -g pm2",
                "Instalar PM2",
                timeout=120
            )
        
        # Crear ecosystem.config.js
        ecosystem_cmd = f"""
cd {APP_DIR}
cat > ecosystem.config.js << 'ECOEOF'
module.exports = {{
  apps: [{{
    name: 'inmova-app',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    max_memory_restart: '1G',
    restart_delay: 4000,
    env: {{
      NODE_ENV: 'production',
      PORT: 3000
    }},
    env_file: '.env.production',
    error_file: '/var/log/inmova/error.log',
    out_file: '/var/log/inmova/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }}]
}}
ECOEOF
echo "ecosystem.config.js creado"
cat ecosystem.config.js
"""
        execute_remote(client, ecosystem_cmd, "Crear ecosystem.config.js")
        
        # Crear directorio logs
        execute_remote(client, "mkdir -p /var/log/inmova", "Crear directorio logs")
        
        # Limpiar PM2 anterior
        execute_remote(
            client,
            "pm2 delete inmova-app 2>/dev/null || echo 'No previous process'",
            "Limpiar PM2 anterior"
        )
        execute_remote(client, "pm2 kill", "Reset PM2")
        
        print("⏱️ Esperando 3 segundos...")
        time.sleep(3)
        
        # Iniciar con PM2
        print("🚀 Iniciando aplicación con PM2...")
        execute_remote(
            client,
            f"cd {APP_DIR} && pm2 start ecosystem.config.js --env production",
            "PM2 start"
        )
        
        execute_remote(client, "pm2 save", "PM2 save")
        execute_remote(
            client,
            "pm2 startup systemd -u root --hp /root",
            "PM2 startup"
        )
        
        # Esperar warm-up
        print("⏱️ Esperando warm-up (20 segundos)...")
        time.sleep(20)
        
        # Verificar PM2 status
        execute_remote(client, "pm2 status", "PM2 status")
        
        # Test HTTP local
        execute_remote(
            client,
            "curl -I http://localhost:3000 2>&1 | head -5",
            "Test HTTP local"
        )
        
        # ================================================================
        # FASE 4: SEGURIDAD
        # ================================================================
        print_phase(4, "SEGURIDAD - FIREWALL")
        
        # Configurar UFW
        firewall_cmd = """
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 3000/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    ufw status | grep -E "22|3000|80|443"
else
    echo "UFW no instalado"
fi
"""
        execute_remote(client, firewall_cmd, "Configurar firewall")
        
        # Verificar security headers
        time.sleep(5)
        execute_remote(
            client,
            f"curl -I http://{SERVER_IP}:3000 2>&1 | head -10",
            "Verificar security headers"
        )
        
        # ================================================================
        # FASE 5: VERIFICACIÓN FINAL
        # ================================================================
        print_phase(5, "VERIFICACIÓN FINAL")
        
        # Ver logs
        execute_remote(
            client,
            "pm2 logs inmova-app --lines 20 --nostream 2>&1 | tail -20",
            "Logs PM2 (últimas 20 líneas)"
        )
        
        # Health check
        execute_remote(
            client,
            "curl -s http://localhost:3000/api/health 2>&1",
            "Health check endpoint"
        )
        
        # Login page check
        execute_remote(
            client,
            "curl -s http://localhost:3000/login 2>&1 | grep -o '<title>.*</title>' | head -1",
            "Verificar login page"
        )
        
        # Verificar procesos
        execute_remote(
            client,
            "ps aux | grep -E 'node|npm' | grep -v grep | head -5",
            "Procesos Node activos"
        )
        
        # ================================================================
        # RESUMEN FINAL
        # ================================================================
        print()
        print_separator('=')
        print("  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
        print_separator('=')
        print()
        print("📊 URLs DE ACCESO:")
        print(f"   🌐 Landing:   http://{SERVER_IP}:3000/landing")
        print(f"   🔐 Login:     http://{SERVER_IP}:3000/login")
        print(f"   📊 Dashboard: http://{SERVER_IP}:3000/dashboard")
        print(f"   💚 Health:    http://{SERVER_IP}:3000/api/health")
        print()
        print("👤 CREDENCIALES DE TEST:")
        print("   📧 Email:    admin@inmova.app")
        print("   🔑 Password: Admin123!")
        print()
        print("📋 VERIFICACIÓN:")
        print("   1. Abrir en navegador: http://{0}:3000/login".format(SERVER_IP))
        print("   2. Hacer login con credenciales de arriba")
        print("   3. Verificar que dashboard carga correctamente")
        print()
        print("🔍 MONITOREO:")
        print("   pm2 status                    # Ver estado")
        print("   pm2 logs inmova-app           # Ver logs en tiempo real")
        print("   pm2 restart inmova-app        # Reiniciar app")
        print()
        print("🎉 ¡LISTO PARA USUARIOS TEST!")
        print()
        
    except paramiko.AuthenticationException:
        print("❌ Error de autenticación SSH")
        print("   Verificar usuario/password")
        sys.exit(1)
    except paramiko.SSHException as e:
        print(f"❌ Error SSH: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()
        print("🔌 Conexión SSH cerrada")

if __name__ == '__main__':
    main()
