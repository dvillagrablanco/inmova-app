#!/usr/bin/env python3
"""Iniciar la aplicación después del build exitoso"""
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

def exec_cmd(client, cmd):
    log(f"$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out:
        for line in out.split('\n')[:15]:
            print(f"  {line}")
    return status, out

print("=" * 60)
print("🚀 INICIANDO APLICACIÓN")
print("=" * 60)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username="root", password=PASSWORD, timeout=10)

try:
    # 1. Matar procesos extraños
    log("1. Limpiando procesos...")
    exec_cmd(client, "pkill -f '/var/www/inmova' 2>/dev/null || true")
    exec_cmd(client, "pm2 delete all 2>/dev/null || true")
    exec_cmd(client, "fuser -k 3000/tcp 2>/dev/null || true")
    time.sleep(2)
    
    # 2. Verificar build
    log("2. Verificando build...")
    status, out = exec_cmd(client, f"ls {APP_PATH}/.next/prerender-manifest.json")
    if status != 0:
        raise Exception("Build no existe")
    log("✅ Build verificado")
    
    # 3. Iniciar PM2
    log("3. Iniciando PM2...")
    exec_cmd(client, f"cd {APP_PATH} && pm2 start npm --name inmova-app -- start")
    
    # 4. Esperar warm-up
    log("4. Esperando warm-up (30s)...")
    time.sleep(30)
    
    # 5. Health checks
    log("5. Health checks...")
    for i in range(8):
        status, out = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 --connect-timeout 5")
        http_code = out.strip()
        log(f"  Intento {i+1}/8: HTTP {http_code}")
        if http_code == "200":
            log("✅ ¡Aplicación respondiendo correctamente!")
            break
        time.sleep(8)
    
    # 6. Guardar PM2
    exec_cmd(client, "pm2 save")
    
    # 7. Estado final
    log("6. Estado final:")
    exec_cmd(client, "pm2 list")
    
    # 8. Health endpoint
    log("7. Verificando /api/health...")
    exec_cmd(client, "curl -s http://localhost:3000/api/health | head -1")
    
    # 9. Verificación externa
    log("8. Verificación externa...")
    status, out = exec_cmd(client, f"curl -s -o /dev/null -w '%{http_code}' https://inmovaapp.com --connect-timeout 10")
    
    print("\n" + "=" * 60)
    print("✅ DEPLOY COMPLETADO")
    print("=" * 60)
    print(f"URL Principal: https://inmovaapp.com")
    print(f"URL Directa: http://{SERVER_IP}:3000")
    print("=" * 60)

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    client.close()
