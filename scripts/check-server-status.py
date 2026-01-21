#!/usr/bin/env python3
"""
Verificar estado del servidor y logs
"""

import sys
from datetime import datetime

try:
    import paramiko
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'paramiko', '-q'])
    import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def cmd(client, command, timeout=60):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

def main():
    print(f"\n{'='*60}\n🔍 DIAGNÓSTICO DEL SERVIDOR\n{'='*60}\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    print("✅ Conectado\n")

    try:
        # PM2 status
        print("📊 PM2 STATUS:")
        out, _ = cmd(client, "pm2 status")
        print(out)

        # PM2 logs recientes
        print("\n📋 PM2 LOGS (últimas 30 líneas):")
        out, _ = cmd(client, "pm2 logs inmova-app --lines 30 --nostream 2>&1")
        print(out[-3000:])  # Últimos 3000 chars

        # Puerto 3000
        print("\n🔌 PUERTO 3000:")
        out, _ = cmd(client, "ss -tlnp | grep :3000")
        print(out if out.strip() else "  No hay proceso escuchando en 3000")

        # Test curl local
        print("\n🌐 TEST CURL LOCAL:")
        out, _ = cmd(client, "curl -v http://localhost:3000/api/health 2>&1 | head -30")
        print(out)

        # Variables de entorno
        print("\n🔧 VARIABLES CRÍTICAS:")
        out, _ = cmd(client, f"cd {APP_PATH} && grep -E '^(NEXTAUTH_URL|DATABASE_URL|PORT)' .env.production | head -5")
        print(out if out.strip() else "  No se encontraron o están vacías")

        # Verificar proceso node
        print("\n⚙️ PROCESOS NODE:")
        out, _ = cmd(client, "ps aux | grep -E 'node|next' | grep -v grep | head -5")
        print(out if out.strip() else "  No hay procesos node corriendo")

        # Restart PM2 si es necesario
        print("\n♻️ REINICIANDO PM2...")
        cmd(client, "pm2 restart inmova-app")
        
        import time
        time.sleep(10)
        
        # Test después de restart
        print("\n🔄 TEST DESPUÉS DE RESTART:")
        out, _ = cmd(client, "curl -sf http://localhost:3000/api/health 2>&1")
        print(f"  Health: {out[:200] if out else 'Sin respuesta'}")

    finally:
        client.close()

if __name__ == "__main__":
    main()
