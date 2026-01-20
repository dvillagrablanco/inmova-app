#!/usr/bin/env python3
"""
Script para crear el addon de conciliación bancaria en producción
"""

import sys
import time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.END):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def exec_cmd(client, cmd, timeout=300):
    log(f"  → {cmd[:100]}{'...' if len(cmd) > 100 else ''}", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print(f"\n{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}🏦 CREAR ADDON CONCILIACIÓN BANCARIA - INMOVA APP{Colors.END}")
    print(f"{Colors.BOLD}{'='*70}{Colors.END}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
    print()

    log("🔐 Conectando al servidor...", Colors.YELLOW)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conexión establecida", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        print()
        log("="*60, Colors.BLUE)
        log("📦 CREAR ADDON EN BASE DE DATOS", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        # Ejecutar script para crear el addon (usar .env.local que tiene la URL real de la BD)
        status, output, error = exec_cmd(client, f"""
cd {APP_PATH} && export $(grep -v '^#' .env.local 2>/dev/null | xargs) && npx tsx scripts/create-bank-reconciliation-addon.ts 2>&1
""", timeout=120)
        
        print(output)
        
        if 'Error' in output or 'error' in error:
            log(f"⚠️ Posibles errores: {error[:500]}", Colors.YELLOW)
        else:
            log("✅ Script ejecutado", Colors.GREEN)

        print()
        log("="*60, Colors.GREEN)
        log("✅ PROCESO COMPLETADO", Colors.GREEN)
        log("="*60, Colors.GREEN)
        print()
        log("El addon de Conciliación Bancaria está disponible:", Colors.BLUE)
        log("  - Código: bank_reconciliation", Colors.CYAN)
        log("  - Precio: 29€/mes", Colors.CYAN)
        log("  - Disponible para: STARTER, PROFESSIONAL, BUSINESS", Colors.CYAN)
        log("  - Incluido en: ENTERPRISE", Colors.CYAN)
        print()
        log("Ver en admin: https://inmovaapp.com/admin/addons", Colors.BLUE)
        print()

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
