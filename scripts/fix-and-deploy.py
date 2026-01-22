#!/usr/bin/env python3
"""Fix build and redeploy"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def log(msg, color=""):
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] {msg}")

def exec_cmd(client, cmd, timeout=300):
    """Execute command and return status"""
    log(f"$ {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    
    if out:
        lines = out.split('\n')
        for line in lines[-15:]:  # Last 15 lines
            print(f"  {line}")
    
    return exit_status, out, err

print("=" * 70)
print("🔧 FIX BUILD AND REDEPLOY")
print("=" * 70)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)

try:
    # Stop PM2
    log("1. Deteniendo PM2...")
    exec_cmd(client, "pm2 stop all 2>/dev/null || true")
    
    # Clean .next directory
    log("2. Limpiando build anterior...")
    exec_cmd(client, f"rm -rf {APP_PATH}/.next")
    exec_cmd(client, f"rm -rf {APP_PATH}/node_modules/.cache")
    
    # Go back to main branch which has a working build
    log("3. Volviendo a branch main (estable)...")
    exec_cmd(client, f"cd {APP_PATH} && git checkout main")
    exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
    
    # Install deps
    log("4. Instalando dependencias...")
    status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps", timeout=600)
    
    # Prisma
    log("5. Configurando Prisma...")
    exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
    
    # Build
    log("6. Construyendo aplicación (puede tardar varios minutos)...")
    status, out, err = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=900)
    
    if status != 0:
        log(f"❌ Build falló con status {status}")
        print(f"Error: {err[:500]}")
    else:
        log("✅ Build completado")
    
    # Check if build artifacts exist
    log("7. Verificando artefactos de build...")
    status, out, err = exec_cmd(client, f"ls -la {APP_PATH}/.next/prerender-manifest.json 2>&1")
    
    if status == 0:
        log("✅ Build artefactos OK")
    else:
        log("❌ Build artefactos no encontrados")
    
    # Start PM2
    log("8. Iniciando PM2...")
    exec_cmd(client, f"cd {APP_PATH} && pm2 start npm --name inmova-app -- start")
    
    # Wait
    log("9. Esperando warm-up (30s)...")
    time.sleep(30)
    
    # Health check
    log("10. Health check...")
    status, out, err = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000")
    
    if "200" in out:
        log("✅ Aplicación respondiendo correctamente")
    else:
        log(f"⚠️ Respuesta: {out}")
    
    # Save PM2
    exec_cmd(client, "pm2 save")
    
    # Final status
    log("11. Estado final de PM2:")
    exec_cmd(client, "pm2 list")
    
    print("\n" + "=" * 70)
    print("🏁 DEPLOYMENT FINALIZADO")
    print("=" * 70)
    
finally:
    client.close()
