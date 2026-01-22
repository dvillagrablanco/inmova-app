#!/usr/bin/env python3
"""Deploy con correcciones de build"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def log(msg, color=""):
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] {msg}")

def exec_cmd(client, cmd, timeout=300):
    log(f"$ {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        for line in out.split('\n')[-15:]:
            print(f"  {line}")
    return status, out, err

print("=" * 70)
print("🚀 DEPLOY CON CORRECCIONES DE BUILD")
print("=" * 70)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username="root", password=PASSWORD, timeout=30)

try:
    # 1. Stop PM2
    log("1. Deteniendo PM2...")
    exec_cmd(client, "pm2 stop all 2>/dev/null || true")
    
    # 2. Clean build
    log("2. Limpiando build anterior...")
    exec_cmd(client, f"rm -rf {APP_PATH}/.next")
    exec_cmd(client, f"rm -rf {APP_PATH}/node_modules/.cache")
    
    # 3. Pull latest code with fixes
    log("3. Actualizando código con correcciones...")
    exec_cmd(client, f"cd {APP_PATH} && git fetch origin")
    exec_cmd(client, f"cd {APP_PATH} && git checkout cursor/p-ginas-visibilidad-y-desarrollo-a55d")
    exec_cmd(client, f"cd {APP_PATH} && git pull origin cursor/p-ginas-visibilidad-y-desarrollo-a55d")
    
    # 4. Install deps
    log("4. Instalando dependencias...")
    exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
    
    # 5. Prisma
    log("5. Configurando Prisma...")
    exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
    
    # 6. Build
    log("6. Construyendo aplicación (puede tardar varios minutos)...")
    status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -40", timeout=900)
    
    # 7. Check build artifacts
    log("7. Verificando artefactos de build...")
    status, out, err = exec_cmd(client, f"ls {APP_PATH}/.next/prerender-manifest.json 2>&1")
    
    if status != 0:
        log("❌ Build falló - prerender-manifest.json no existe")
        log("Verificando errores específicos...")
        exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | grep -i 'error\\|failed' | head -20", timeout=300)
        raise Exception("Build failed")
    
    log("✅ Build exitoso - prerender-manifest.json existe")
    
    # 8. Start PM2
    log("8. Iniciando PM2...")
    exec_cmd(client, "pm2 delete all 2>/dev/null || true")
    exec_cmd(client, f"cd {APP_PATH} && pm2 start npm --name inmova-app -- start")
    
    # 9. Wait for warm-up
    log("9. Esperando warm-up (45s)...")
    time.sleep(45)
    
    # 10. Health checks
    log("10. Health checks...")
    for i in range(5):
        status, out, err = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 --connect-timeout 5")
        log(f"  Intento {i+1}: HTTP {out}")
        if "200" in out:
            log("✅ Aplicación respondiendo correctamente")
            break
        time.sleep(10)
    
    # 11. Save PM2
    exec_cmd(client, "pm2 save")
    
    # Final status
    log("11. Estado final:")
    exec_cmd(client, "pm2 list")
    
    print("\n" + "=" * 70)
    print("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
    print("=" * 70)
    print(f"URL: https://inmovaapp.com")
    print(f"Fallback: http://{SERVER_IP}:3000")
    print("=" * 70)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    log("Intentando recuperar estado anterior...")
finally:
    client.close()
