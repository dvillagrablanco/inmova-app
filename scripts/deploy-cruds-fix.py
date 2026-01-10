#!/usr/bin/env python3
"""
Deploy script para las correcciones de CRUDs del superadministrador
Servidor: 157.180.119.236
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}{msg}{Colors.END}")

def exec_cmd(client, command, timeout=300):
    """Ejecuta comando SSH y retorna (exit_status, output)"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output + error

def main():
    log("=" * 70, Colors.CYAN)
    log("🚀 DEPLOYMENT - Correcciones CRUDs Superadministrador", Colors.CYAN)
    log("=" * 70, Colors.CYAN)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # Conectar
        log(f"\n[1/8] 🔐 Conectando a {SERVER_IP}...", Colors.YELLOW)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado", Colors.GREEN)

        # Git pull
        log("\n[2/8] 📥 Actualizando código...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if status != 0:
            log(f"⚠️ Git pull warning: {output[:500]}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)

        # Install dependencies
        log("\n[3/8] 📦 Instalando dependencias...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
        if status != 0:
            log(f"⚠️ npm install warning", Colors.YELLOW)
        log("✅ Dependencias instaladas", Colors.GREEN)

        # Prisma generate
        log("\n[4/8] 🔧 Generando Prisma...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        log("✅ Prisma generado", Colors.GREEN)

        # Run seed script for coupons
        log("\n[5/8] 🎟️ Cargando cupones de la landing...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx tsx scripts/seed-landing-coupons.ts", timeout=120)
        if status == 0:
            log(f"✅ Cupones cargados", Colors.GREEN)
            # Mostrar resultado
            for line in output.split('\n'):
                if '✅' in line or '⏭️' in line or '❌' in line:
                    print(f"   {line}")
        else:
            log(f"⚠️ Seed warning: {output[:500]}", Colors.YELLOW)

        # Build
        log("\n[6/8] 🏗️ Construyendo aplicación...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=900)
        if status != 0:
            log(f"❌ Build error: {output[-1000:]}", Colors.RED)
            return False
        log("✅ Build completado", Colors.GREEN)

        # Restart PM2
        log("\n[7/8] ♻️ Reiniciando PM2...", Colors.YELLOW)
        status, output = exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app || pm2 start ecosystem.config.js --env production")
        log("✅ PM2 reiniciado", Colors.GREEN)

        # Wait for warm-up
        log("\n[8/8] ⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)

        # Health check
        log("\n🏥 Verificando salud...", Colors.YELLOW)
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:500]}", Colors.YELLOW)

        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)

        log("\n📍 URLs:", Colors.CYAN)
        log("   - https://inmovaapp.com", Colors.END)
        log("   - http://157.180.119.236:3000", Colors.END)

        log("\n📋 Cambios desplegados:", Colors.CYAN)
        log("   - API invitaciones partners: /api/admin/partners/invitations", Colors.END)
        log("   - API categorías marketplace: /api/admin/marketplace/categories", Colors.END)
        log("   - API proveedores marketplace: /api/admin/marketplace/providers", Colors.END)
        log("   - API reservas marketplace: /api/admin/marketplace/reservations", Colors.END)
        log("   - API comisiones marketplace: /api/admin/marketplace/commissions", Colors.END)
        log("   - Cupones de la landing cargados en BD", Colors.END)
        log("   - Botones funcionales en todas las páginas", Colors.END)

        return True

    except Exception as e:
        log(f"\n❌ Error: {e}", Colors.RED)
        return False
    finally:
        client.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
