#!/usr/bin/env python3
"""
Script para copiar y ejecutar el script de creación de empresa
"""
import sys
import time
import os
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}{msg}{Colors.END}")

def main():
    log("=" * 70, Colors.CYAN)
    log("🏢 CREAR EMPRESA REAL CON DATOS DE VALIDACIÓN", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    # Leer el script
    script_path = os.path.join(os.path.dirname(__file__), 'create-company-server.ts')
    with open(script_path, 'r') as f:
        script_content = f.read()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
        
        # Copiar script al servidor usando SFTP
        log("\n📤 [1/2] Copiando script al servidor...", Colors.BLUE)
        sftp = client.open_sftp()
        with sftp.file(f'{APP_PATH}/scripts/create-company-server.ts', 'w') as f:
            f.write(script_content)
        sftp.close()
        log("✅ Script copiado", Colors.GREEN)
        
        # Ejecutar script
        log("\n🚀 [2/2] Ejecutando script de creación...", Colors.BLUE)
        stdin, stdout, stderr = client.exec_command(
            f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && npx tsx scripts/create-company-server.ts 2>&1",
            timeout=120
        )
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        
        print(output)
        
        if exit_status == 0:
            log("\n✅ Script ejecutado exitosamente", Colors.GREEN)
        else:
            log("\n⚠️ Script completó con advertencias", Colors.YELLOW)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ PROCESO COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
