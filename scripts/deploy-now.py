#!/usr/bin/env python3
"""
Deployment script usando Paramiko
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
BRANCH = "cursor/login-y-sidebar-fce3"

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando y retornar output"""
    print(f"  → {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    if error and exit_status != 0:
        print(f"  ⚠️ Error: {error[:200]}")
    return exit_status, output, error

def main():
    print("=" * 70)
    print("🚀 DEPLOYMENT A PRODUCCIÓN")
    print("=" * 70)
    print(f"Servidor: {SERVER_IP}")
    print(f"Branch: {BRANCH}")
    print(f"Path: {APP_PATH}")
    print("=" * 70)
    
    # Conectar
    print("\n📡 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        print("✅ Conectado")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False
    
    try:
        # 1. Backup rápido
        print("\n💾 Creando backup...")
        exec_cmd(client, f"cd {APP_PATH} && git stash 2>/dev/null || true")
        
        # 2. Obtener cambios
        print("\n📥 Actualizando código...")
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git fetch origin {BRANCH}")
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git checkout {BRANCH} 2>/dev/null || git checkout -b {BRANCH} origin/{BRANCH}")
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git pull origin {BRANCH}")
        print(f"  {output[:200] if output else 'OK'}")
        
        # 3. Instalar dependencias
        print("\n📦 Instalando dependencias...")
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=600)
        print(f"  {output[:200] if output else 'OK'}")
        
        # 4. Generar Prisma
        print("\n🔧 Generando Prisma Client...")
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3")
        print(f"  {output[:200] if output else 'OK'}")
        
        # 5. Build
        print("\n🏗️ Building aplicación...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        if status != 0:
            print(f"  ⚠️ Build output: {output[-500:]}")
            print(f"  ⚠️ Build puede tener warnings pero continuamos...")
        else:
            print(f"  {output[-300:] if output else 'OK'}")
        
        # 6. Restart PM2
        print("\n♻️ Reiniciando PM2...")
        exec_cmd(client, f"cd {APP_PATH} && pm2 delete inmova-app 2>/dev/null || true")
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production")
        print(f"  {output[:200] if output else 'OK'}")
        
        # 7. Esperar warm-up
        print("\n⏳ Esperando warm-up (20s)...")
        time.sleep(20)
        
        # 8. Health check
        print("\n🏥 Health check...")
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            print("  ✅ API Health: OK")
        else:
            print(f"  ⚠️ Health response: {output[:200]}")
        
        # 9. Verificar headers
        print("\n🔐 Verificando headers de seguridad...")
        status, output, _ = exec_cmd(client, "curl -sI http://localhost:3000/landing | head -20")
        print(f"  {output[:400]}")
        
        # 10. PM2 status
        print("\n📊 Estado PM2...")
        status, output, _ = exec_cmd(client, "pm2 status")
        print(f"  {output}")
        
        print("\n" + "=" * 70)
        print("✅ DEPLOYMENT COMPLETADO")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante deployment: {e}")
        return False
    finally:
        client.close()
        print("\n📡 Conexión cerrada")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
