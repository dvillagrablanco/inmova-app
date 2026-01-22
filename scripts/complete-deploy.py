#!/usr/bin/env python3
"""Deploy completo con pull y reinicio"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def log(msg):
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] {msg}")

def exec_cmd(client, cmd, timeout=300):
    log(f"$ {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        for line in out.split('\n')[-10:]:
            print(f"  {line}")
    return status, out, err

print("=" * 60)
print("🚀 DEPLOY COMPLETO")
print("=" * 60)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username="root", password=PASSWORD, timeout=30)

try:
    # 1. Stop PM2
    log("1. Deteniendo PM2...")
    exec_cmd(client, "pm2 stop all 2>/dev/null || true")
    
    # 2. Pull latest
    log("2. Actualizando código...")
    exec_cmd(client, f"cd {APP_PATH} && git fetch origin")
    exec_cmd(client, f"cd {APP_PATH} && git checkout cursor/p-ginas-visibilidad-y-desarrollo-a55d")
    exec_cmd(client, f"cd {APP_PATH} && git pull origin cursor/p-ginas-visibilidad-y-desarrollo-a55d")
    
    # 3. Verificar commit
    log("3. Verificando commit...")
    exec_cmd(client, f"cd {APP_PATH} && git log --oneline -3")
    
    # 4. Clean and rebuild
    log("4. Limpiando build anterior...")
    exec_cmd(client, f"rm -rf {APP_PATH}/.next")
    
    log("5. Instalando dependencias...")
    exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
    
    log("6. Prisma generate...")
    exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
    
    log("7. Building (puede tardar varios minutos)...")
    status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -30", timeout=900)
    
    # 8. Verificar build
    log("8. Verificando build...")
    status, out, err = exec_cmd(client, f"ls -la {APP_PATH}/.next/prerender-manifest.json")
    if status != 0:
        raise Exception("Build failed - prerender-manifest.json no existe")
    
    # 9. Start PM2
    log("9. Iniciando PM2...")
    exec_cmd(client, "pm2 delete all 2>/dev/null || true")
    exec_cmd(client, "fuser -k 3000/tcp 2>/dev/null || true")
    time.sleep(2)
    exec_cmd(client, f"cd {APP_PATH} && pm2 start npm --name inmova-app -- start")
    
    # 10. Warm-up
    log("10. Esperando warm-up (30s)...")
    time.sleep(30)
    
    # 11. Health check
    log("11. Health checks...")
    for i in range(5):
        status, out, err = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 --connect-timeout 5")
        log(f"  HTTP: {out.strip()}")
        if "200" in out:
            log("✅ Aplicación respondiendo!")
            break
        time.sleep(10)
    
    # 12. Save PM2
    exec_cmd(client, "pm2 save")
    
    # 13. Estado final
    log("12. Estado final:")
    exec_cmd(client, "pm2 list")
    
    print("\n" + "=" * 60)
    print("✅ DEPLOY COMPLETADO")
    print("=" * 60)
    print(f"URL: https://inmovaapp.com")
    print(f"URL Directa: http://{SERVER_IP}:3000")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
finally:
    client.close()
