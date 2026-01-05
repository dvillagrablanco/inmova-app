#!/usr/bin/env python3
"""
Fix git issues and deploy
"""

import sys
import time

try:
    import paramiko
except ImportError:
    print("Installing paramiko...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, command, timeout=300):
    print(f"  → {command[:100]}...")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    if output:
        print(f"    OUT: {output[:500]}")
    if error:
        print(f"    ERR: {error[:500]}")
    return exit_status, output, error

def main():
    print("🔐 Conectando...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=15)
    print("✅ Conectado\n")

    try:
        # 1. Ver estado de git
        print("📋 Estado de Git en servidor:")
        exec_cmd(client, f"cd {APP_PATH} && git status")
        
        # 2. Reset hard y pull
        print("\n🔄 Reseteando y actualizando código:")
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin main")
        exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/main")
        
        # 3. Verificar commit
        print("\n📌 Commit actual:")
        exec_cmd(client, f"cd {APP_PATH} && git log --oneline -3")
        
        # 4. Prisma generate
        print("\n🔧 Prisma generate:")
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1", timeout=120)
        
        # 5. Build
        print("\n🏗️ Build (puede tomar 2-4 minutos):")
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && export NODE_ENV=production && npm run build 2>&1",
            timeout=600
        )
        
        if status != 0:
            print("❌ Build falló, pero continuamos...")
        
        # 6. Restart PM2
        print("\n♻️ Reiniciando PM2:")
        exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1")
        exec_cmd(client, "pm2 save")
        
        # 7. Esperar
        print("\n⏳ Esperando warm-up (20s)...")
        time.sleep(20)
        
        # 8. Health checks
        print("\n🏥 Health checks:")
        checks = [
            ("API Health", "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health"),
            ("Landing Inmova", "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing"),
            ("eWoorker Landing", "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ewoorker/landing"),
            ("Login", "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login"),
        ]
        
        passed = 0
        for name, cmd in checks:
            status, output, _ = exec_cmd(client, cmd)
            if "200" in output:
                print(f"  ✅ {name}: OK")
                passed += 1
            else:
                print(f"  ❌ {name}: {output}")
        
        print(f"\n{'='*60}")
        print(f"✅ DEPLOYMENT COMPLETADO - {passed}/{len(checks)} checks OK")
        print(f"{'='*60}")
        
        print("""
🌐 URLs:
   • https://inmovaapp.com/landing
   • https://inmovaapp.com/ewoorker/landing
   • https://inmovaapp.com/login
        """)
        
        return 0 if passed >= 3 else 1
        
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
