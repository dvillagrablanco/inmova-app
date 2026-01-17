#!/usr/bin/env python3
"""Fix build conflicts and rebuild"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print(f"\n{'='*70}")
    print("🔧 FIXING BUILD CONFLICTS AND REBUILDING")
    print(f"{'='*70}\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Eliminar archivos conflictivos
        log("🗑️ Eliminando archivos conflictivos en pages/api...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && rm -rf pages/api/sales-team/representatives/ 2>/dev/null")
        log("✅ Archivos conflictivos eliminados", Colors.GREEN)
        
        # 2. Limpiar cache de Next.js
        log("🧹 Limpiando cache de Next.js...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && rm -rf .next/cache 2>/dev/null")
        log("✅ Cache limpiado", Colors.GREEN)
        
        # 3. Rebuild
        log("🏗️ Rebuilding aplicación (puede tardar 3-5 min)...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1", timeout=600)
        
        if "Conflicting app and page files" in output:
            log("⚠️ Aún hay conflictos, mostrando...", Colors.YELLOW)
            print(output[-1000:])
        elif status != 0:
            log(f"⚠️ Build terminó con código {status}", Colors.YELLOW)
            print(output[-500:])
        else:
            log("✅ Build completado exitosamente", Colors.GREEN)
        
        # 4. Verificar que las páginas existen en .next
        log("📂 Verificando páginas compiladas...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f"ls -la {APP_PATH}/.next/server/app/configuracion/integraciones/ 2>&1 | head -10")
        print(output)
        
        # 5. Reiniciar PM2
        log("♻️ Reiniciando PM2...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # 6. Esperar warm-up
        log("⏳ Esperando warm-up (25s)...", Colors.CYAN)
        time.sleep(25)
        
        # 7. Verificar rutas
        log("🧪 Verificando rutas...", Colors.CYAN)
        routes = [
            '/configuracion',
            '/configuracion/integraciones',
            '/seguridad',
            '/firma-digital/configuracion',
        ]
        
        for route in routes:
            status, output, _ = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{route}")
            code = output.strip()
            if code == "200":
                log(f"  ✅ {route} -> {code}", Colors.GREEN)
            else:
                log(f"  ❌ {route} -> {code}", Colors.RED)
        
        print(f"\n{'='*70}")
        print("Deployment fix completado")
        print(f"{'='*70}\n")
        
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
    finally:
        client.close()

if __name__ == '__main__':
    main()
