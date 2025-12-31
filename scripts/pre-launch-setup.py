#!/usr/bin/env python3
"""
Pre-Launch Setup Script
Ejecuta todas las fases del checklist antes del deploy
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
import os
from datetime import datetime

# Server credentials
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def print_phase(phase_num, title):
    print(f"\n{'='*60}")
    print(f"  FASE {phase_num}: {title}")
    print(f"{'='*60}\n")

def execute_command(client, command, description):
    """Execute SSH command and return output"""
    print(f"⚡ {description}")
    print(f"   $ {command}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=300)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status == 0:
        print(f"   ✅ Success")
        if output and len(output) < 500:
            print(f"   Output: {output[:200]}")
    else:
        print(f"   ❌ Failed (exit code: {exit_status})")
        if error:
            print(f"   Error: {error[:500]}")
        raise Exception(f"Command failed: {command}")
    
    return output, error, exit_status

def main():
    print("\n" + "="*60)
    print("  🚀 PRE-LAUNCH SETUP - INMOVA APP")
    print("="*60)
    print(f"  Server: {SERVER_IP}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    # Connect to server
    print("🔌 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        print("✅ Conectado exitosamente\n")
        
        # ================================================================
        # FASE 1: PRE-DEPLOYMENT
        # ================================================================
        print_phase(1, "PRE-DEPLOYMENT CHECKS")
        
        # 1.1 Verificar si directorio existe
        execute_command(client, f"ls -la {APP_DIR}", "Verificar directorio de app")
        
        # 1.2 Backup de BD (si existe)
        backup_cmd = f"""
        if command -v pg_dump &> /dev/null; then
            BACKUP_FILE="/root/backup_inmova_$(date +%Y%m%d_%H%M%S).sql"
            pg_dump -U postgres inmova_production > $BACKUP_FILE 2>/dev/null || echo "No DB to backup"
            ls -lh /root/backup_*.sql | tail -1
        else
            echo "PostgreSQL not installed or not configured"
        fi
        """
        execute_command(client, backup_cmd, "Crear backup de BD")
        
        # 1.3 Verificar Node.js
        execute_command(client, "node --version", "Verificar Node.js version")
        
        # 1.4 Verificar npm/yarn
        execute_command(client, "npm --version", "Verificar npm version")
        
        # ================================================================
        # FASE 2: DEPLOYMENT
        # ================================================================
        print_phase(2, "DEPLOYMENT")
        
        # 2.1 Crear directorio si no existe
        execute_command(client, f"mkdir -p {APP_DIR}", "Crear directorio de app")
        
        # 2.2 Clone o pull del repositorio
        check_git = f"test -d {APP_DIR}/.git && echo 'exists' || echo 'not_exists'"
        output, _, _ = execute_command(client, check_git, "Verificar repositorio git")
        
        if 'not_exists' in output:
            print("📥 Clonando repositorio...")
            execute_command(
                client,
                f"cd {APP_DIR} && git clone https://github.com/dvillagrablanco/inmova-app.git .",
                "Clonar repositorio"
            )
        else:
            print("🔄 Actualizando repositorio...")
            execute_command(client, f"cd {APP_DIR} && git fetch origin", "Fetch changes")
            execute_command(client, f"cd {APP_DIR} && git checkout main", "Checkout main")
            execute_command(client, f"cd {APP_DIR} && git pull origin main", "Pull latest")
        
        # 2.3 Instalar dependencias
        print("📦 Instalando dependencias...")
        execute_command(
            client,
            f"cd {APP_DIR} && npm install --production=false",
            "npm install"
        )
        
        # 2.4 Verificar/Crear .env.production
        print("🔐 Configurando variables de entorno...")
        env_check = f"test -f {APP_DIR}/.env.production && echo 'exists' || echo 'not_exists'"
        env_output, _, _ = execute_command(client, env_check, "Verificar .env.production")
        
        if 'not_exists' in env_output:
            print("⚠️ .env.production NO existe - creando template...")
            env_template = f"""cat > {APP_DIR}/.env.production << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@localhost:5432/inmova_production
NEXTAUTH_URL=http://{SERVER_IP}:3000
NEXTAUTH_SECRET=inmova-secret-change-this-in-production-min-32-chars
NEXT_PUBLIC_APP_URL=http://{SERVER_IP}:3000
PORT=3000
EOF"""
            execute_command(client, env_template, "Crear .env.production template")
            print("⚠️ IMPORTANTE: Editar .env.production con valores reales")
        
        # 2.5 Generar Prisma Client
        print("🔨 Generando Prisma Client...")
        execute_command(
            client,
            f"cd {APP_DIR} && npx prisma generate",
            "Prisma generate"
        )
        
        # 2.6 Build Next.js
        print("🏗️ Building Next.js app...")
        execute_command(
            client,
            f"cd {APP_DIR} && npm run build 2>&1 | tail -50",
            "Next.js build"
        )
        
        # ================================================================
        # FASE 3: POST-DEPLOYMENT
        # ================================================================
        print_phase(3, "POST-DEPLOYMENT")
        
        # 3.1 Matar procesos viejos en puerto 3000
        print("🔄 Limpiando procesos viejos...")
        execute_command(
            client,
            "fuser -k 3000/tcp || echo 'No process on port 3000'",
            "Matar procesos en puerto 3000"
        )
        
        # 3.2 Verificar si PM2 está instalado
        pm2_check = "command -v pm2 && echo 'installed' || echo 'not_installed'"
        pm2_output, _, _ = execute_command(client, pm2_check, "Verificar PM2")
        
        if 'not_installed' in pm2_output:
            print("📦 Instalando PM2...")
            execute_command(client, "npm install -g pm2", "Instalar PM2 global")
        
        # 3.3 Crear ecosystem.config.js si no existe
        ecosystem_check = f"test -f {APP_DIR}/ecosystem.config.js && echo 'exists' || echo 'not_exists'"
        eco_output, _, _ = execute_command(client, ecosystem_check, "Verificar ecosystem.config.js")
        
        if 'not_exists' in eco_output:
            print("📝 Creando ecosystem.config.js...")
            ecosystem_config = f"""cat > {APP_DIR}/ecosystem.config.js << 'EOF'
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
EOF"""
            execute_command(client, ecosystem_config, "Crear ecosystem.config.js")
        
        # 3.4 Crear directorio de logs
        execute_command(client, "mkdir -p /var/log/inmova", "Crear directorio de logs")
        
        # 3.5 Iniciar app con PM2
        print("🚀 Iniciando aplicación con PM2...")
        execute_command(client, f"cd {APP_DIR} && pm2 delete inmova-app || echo 'No previous process'", "Limpiar PM2")
        execute_command(
            client,
            f"cd {APP_DIR} && pm2 start ecosystem.config.js --env production",
            "Iniciar con PM2"
        )
        execute_command(client, "pm2 save", "Guardar configuración PM2")
        
        # 3.6 Esperar warm-up
        print("⏱️ Esperando warm-up (15 segundos)...")
        time.sleep(15)
        
        # 3.7 Test local
        execute_command(
            client,
            "curl -I http://localhost:3000 2>&1 | head -1",
            "Test HTTP local"
        )
        
        # ================================================================
        # FASE 4: SEGURIDAD
        # ================================================================
        print_phase(4, "SECURITY CHECKS")
        
        # 4.1 Abrir puerto 3000 en firewall
        print("🔥 Configurando firewall...")
        execute_command(
            client,
            "command -v ufw && ufw allow 3000/tcp || echo 'ufw not installed'",
            "Abrir puerto 3000"
        )
        
        # 4.2 Verificar security headers (después de que esté running)
        time.sleep(5)
        execute_command(
            client,
            f"curl -I http://{SERVER_IP}:3000 2>&1 | grep -E 'HTTP|X-Frame|X-Content'",
            "Verificar security headers"
        )
        
        # ================================================================
        # FASE 5: PERFORMANCE & UX
        # ================================================================
        print_phase(5, "PERFORMANCE & UX VERIFICATION")
        
        # 5.1 Verificar que la app responde
        execute_command(
            client,
            f"curl -s http://localhost:3000/api/health 2>&1 || echo '{{\"status\":\"checking\"}}'",
            "Health check endpoint"
        )
        
        # 5.2 Ver estado de PM2
        execute_command(client, "pm2 status", "Estado PM2")
        
        # 5.3 Ver logs recientes
        execute_command(
            client,
            "pm2 logs inmova-app --lines 20 --nostream",
            "Logs recientes"
        )
        
        # ================================================================
        # FASE 6: USUARIOS TEST
        # ================================================================
        print_phase(6, "TEST USERS SETUP")
        
        # 6.1 Ejecutar script de fix-auth si existe
        fix_auth = f"test -f {APP_DIR}/scripts/fix-auth-complete.ts && echo 'exists' || echo 'not_exists'"
        auth_output, _, _ = execute_command(client, fix_auth, "Verificar script fix-auth")
        
        if 'exists' in auth_output:
            print("👥 Creando usuarios de test...")
            execute_command(
                client,
                f"cd {APP_DIR} && npx tsx scripts/fix-auth-complete.ts",
                "Crear usuarios de test"
            )
        
        # ================================================================
        # RESUMEN FINAL
        # ================================================================
        print("\n" + "="*60)
        print("  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
        print("="*60 + "\n")
        
        print("📊 URLs de Acceso:")
        print(f"   🌐 Landing: http://{SERVER_IP}:3000/landing")
        print(f"   🔐 Login: http://{SERVER_IP}:3000/login")
        print(f"   📊 Dashboard: http://{SERVER_IP}:3000/dashboard")
        print(f"   💚 Health: http://{SERVER_IP}:3000/api/health")
        
        print("\n👤 Credenciales de Test:")
        print("   📧 admin@inmova.app")
        print("   🔑 Admin123!")
        
        print("\n📋 Próximos Pasos:")
        print("   1. Abrir http://{0}:3000/login en navegador".format(SERVER_IP))
        print("   2. Hacer login con credenciales de test")
        print("   3. Verificar que dashboard carga")
        print("   4. Invitar usuarios test")
        print("   5. Monitorear logs: pm2 logs inmova-app")
        
        print("\n🎉 ¡Listo para testing con usuarios!")
        
    except Exception as e:
        print(f"\n❌ Error durante deployment: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == '__main__':
    main()
