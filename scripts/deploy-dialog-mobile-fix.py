#!/usr/bin/env python3
"""
Script de Deployment para fix de diálogo en móviles
"""

import sys
import time
import os

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = os.getenv("SSH_PASSWORD", "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=")
APP_PATH = "/opt/inmova-app"

def log(msg, color=None):
    colors = {'green': '\033[92m', 'red': '\033[91m', 'yellow': '\033[93m', 'cyan': '\033[96m', 'end': '\033[0m'}
    timestamp = time.strftime('%H:%M:%S')
    if color and color in colors:
        print(f"{colors[color]}[{timestamp}] {msg}{colors['end']}")
    else:
        print(f"[{timestamp}] {msg}")

def exec_cmd(client, command, timeout=300):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_code, output, error

def main():
    print("=" * 60)
    log("🚀 DEPLOYMENT: Fix diálogo móviles", "cyan")
    print("=" * 60)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando...", "yellow")
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", "green")
        
        # Pull cambios
        log("📥 Actualizando código...", "yellow")
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin")
        exec_cmd(client, f"cd {APP_PATH} && git pull origin cursor/proyecto-inmova-despliegue-032a")
        
        exit_code, output, _ = exec_cmd(client, f"cd {APP_PATH} && git log -1 --oneline")
        log(f"📝 Commit: {output.strip()}", "cyan")
        
        # Build
        log("🏗️ Building...", "yellow")
        exit_code, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=900)
        
        if exit_code != 0:
            log(f"❌ Error en build:\n{output}\n{error}", "red")
            return 1
        log("✅ Build completado", "green")
        
        # Restart
        log("♻️ Reiniciando...", "yellow")
        exec_cmd(client, "pm2 reload inmova-app")
        log("✅ PM2 reiniciado", "green")
        
        # Warm-up
        log("⏳ Warm-up (15s)...", "yellow")
        time.sleep(15)
        
        # Health check
        exit_code, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/propiedades")
        status = output.strip()
        
        print("\n" + "=" * 60)
        if status in ['200', '302']:
            log("🎉 DEPLOYMENT COMPLETADO", "green")
            log(f"✅ /propiedades: {status}", "green")
        else:
            log(f"⚠️ Estado: {status}", "yellow")
        print("=" * 60)
        
        print(f"""
Cambios desplegados:
  ✅ Fondo sólido en diálogos (blanco/oscuro)
  ✅ Bordes redondeados en móviles
  ✅ Margen lateral para mejor visualización
  ✅ Sombra más prominente

Para verificar:
  1. Abrir https://inmovaapp.com/propiedades en móvil
  2. Ir al menú de una propiedad → Eliminar
  3. El diálogo debe verse con fondo sólido
""")
        return 0
        
    except Exception as e:
        log(f"❌ Error: {e}", "red")
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
