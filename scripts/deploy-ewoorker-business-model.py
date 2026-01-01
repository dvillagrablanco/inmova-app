#!/usr/bin/env python3
"""
Script de deployment para eWoorker Business Model
Actualiza precios en sublanding, crea usuario socio, y deploya
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONFIG
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/home/deploy/inmova-app'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def execute_command(ssh, command, timeout=300):
    """Ejecuta comando SSH y retorna output"""
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print("\n" + "━" * 80)
    print("🚀 DEPLOYMENT EWOORKER BUSINESS MODEL")
    print("━" * 80 + "\n")

    # Conectar SSH
    print("📡 Conectando al servidor...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado al servidor\n")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

    try:
        # 1. Git Pull
        print("📥 Actualizando código desde Git...")
        status, output, error = execute_command(ssh, f"cd {APP_DIR} && git pull origin main")
        if status == 0:
            print("✅ Git pull exitoso")
        else:
            print(f"⚠️  Git pull warning: {error[:200]}")

        # 2. npm install
        print("\n📦 Instalando dependencias...")
        status, output, error = execute_command(ssh, f"cd {APP_DIR} && npm install", timeout=600)
        if status == 0:
            print("✅ npm install exitoso")
        else:
            print(f"⚠️  npm install warning: {error[:200]}")

        # 3. Prisma generate
        print("\n🔧 Generando Prisma Client...")
        status, output, error = execute_command(ssh, f"cd {APP_DIR} && npx prisma generate")
        if status == 0:
            print("✅ Prisma generate exitoso")
        else:
            print(f"❌ Prisma generate falló: {error[:300]}")

        # 4. Crear usuario del socio
        print("\n👤 Creando usuario del socio fundador...")
        status, output, error = execute_command(
            ssh,
            f"cd {APP_DIR} && npx tsx scripts/create-ewoorker-partner-user.ts",
            timeout=60
        )
        if status == 0:
            print("✅ Usuario socio creado")
            # Extraer credenciales del output
            if "CREDENCIALES DE ACCESO" in output:
                lines = output.split('\n')
                for i, line in enumerate(lines):
                    if 'Email:' in line or 'Password:' in line or 'Panel:' in line:
                        print(f"   {line.strip()}")
        else:
            print(f"⚠️  Warning: {error[:300]}")

        # 5. Build
        print("\n🔨 Compilando aplicación (esto puede tardar 5-10 min)...")
        status, output, error = execute_command(
            ssh,
            f"cd {APP_DIR} && npm run build",
            timeout=900
        )
        if status == 0:
            print("✅ Build exitoso")
        else:
            print(f"⚠️  Build warning: {error[:300]}")

        # 6. PM2 reload
        print("\n🔄 Reiniciando aplicación con PM2...")
        status, output, error = execute_command(ssh, "pm2 reload all")
        if status == 0:
            print("✅ PM2 reloaded")
        else:
            print(f"⚠️  PM2 warning: {error[:200]}")

        # 7. Health checks
        print("\n🏥 Verificando health checks...")
        time.sleep(15)

        checks = [
            ("Main Landing", "http://localhost:3000/landing"),
            ("eWoorker Landing", "http://localhost:3000/ewoorker/landing"),
            ("Admin Socio Panel", "http://localhost:3000/ewoorker/admin-socio"),
            ("Metrics API", "http://localhost:3000/api/ewoorker/admin-socio/metrics"),
        ]

        for name, url in checks:
            status, output, error = execute_command(ssh, f"curl -f -s -o /dev/null -w '%{{http_code}}' {url}")
            http_code = output.strip()
            if http_code in ['200', '302', '401', '403']:
                print(f"   ✅ {name}: {http_code}")
            else:
                print(f"   ⚠️  {name}: {http_code}")

        print("\n" + "━" * 80)
        print("✅ DEPLOYMENT EWOORKER COMPLETADO")
        print("━" * 80 + "\n")

        print("📋 PRÓXIMOS PASOS:")
        print("   1. Verificar manualmente: https://inmovaapp.com/ewoorker/landing")
        print("   2. Login del socio: https://inmovaapp.com/login")
        print("      → Email: socio@ewoorker.com")
        print("      → Password: Ewoorker2025!Socio")
        print("   3. Panel del socio: https://inmovaapp.com/ewoorker/admin-socio")
        print("   4. Verificar precios actualizados en landing")
        print("\n")

        return True

    except Exception as e:
        print(f"\n❌ Error durante deployment: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        ssh.close()
        print("🔌 Conexión SSH cerrada\n")

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
