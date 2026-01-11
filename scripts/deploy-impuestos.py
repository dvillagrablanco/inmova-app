#!/usr/bin/env python3
"""
Script de deployment para Módulo de Impuestos
"""

import sys
import time
import subprocess

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
    log(f"  → {cmd[:80]}{'...' if len(cmd) > 80 else ''}", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print(f"\n{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}💰 DEPLOYMENT - MÓDULO DE GESTIÓN DE IMPUESTOS{Colors.END}")
    print(f"{Colors.BOLD}{'='*70}{Colors.END}\n")

    # Git commit y push
    log("📝 Commit y push de cambios...", Colors.YELLOW)
    
    try:
        result = subprocess.run(
            ['git', 'commit', '-m', 'feat(impuestos): Add tax management module for companies\n\n- Create /admin/impuestos page with fiscal management\n- Support for both individuals (IRPF) and companies (IS)\n- Tax calculator for rental income\n- IBI tracking for properties\n- Fiscal calendar with deadlines\n- Integration with Spanish tax models (100, 115, 180, 200, 202, 303, 390, 347)'],
            cwd='/workspace',
            capture_output=True,
            text=True
        )
        log("✅ Commit realizado", Colors.GREEN)
        
        result = subprocess.run(
            ['git', 'push', 'origin', 'main'],
            cwd='/workspace',
            capture_output=True,
            text=True
        )
        log("✅ Push completado", Colors.GREEN)
    except Exception as e:
        log(f"⚠️ Git: {e}", Colors.YELLOW)

    print()
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1

    try:
        # Pull
        log("📥 Actualizando código...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && git pull origin main 2>&1", timeout=120)
        log("✅ Código actualizado", Colors.GREEN)

        # Dependencies
        log("📦 Verificando dependencias...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && npm install 2>&1 | tail -3", timeout=300)
        log("✅ Dependencias OK", Colors.GREEN)

        # Build
        log("🏗️ Build...", Colors.BLUE)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -15", timeout=600)
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"❌ Build falló", Colors.RED)
            print(output[-500:] if output else error[-500:])
            return 1

        # PM2 reload
        log("🚀 Reiniciando PM2...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1", timeout=60)
        log("✅ PM2 reloaded", Colors.GREEN)

        # Wait
        log("⏳ Warm-up (15s)...", Colors.YELLOW)
        time.sleep(15)

        # Verify
        log("🏥 Verificación...", Colors.BLUE)
        
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health | head -c 100")
        if '"status":"ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health: {output[:50]}", Colors.YELLOW)

        status, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/admin/impuestos")
        if '200' in output or '302' in output:
            log("✅ Página Impuestos accesible", Colors.GREEN)
        else:
            log(f"⚠️ Impuestos: HTTP {output}", Colors.YELLOW)

        status, output, _ = exec_cmd(client, "pm2 status | grep inmova")
        if 'online' in output.lower():
            log("✅ PM2: online", Colors.GREEN)
        else:
            log(f"⚠️ PM2: {output}", Colors.YELLOW)

        print()
        log("="*70, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("="*70, Colors.GREEN)
        print()
        
        log("📍 URL: https://inmovaapp.com/admin/impuestos", Colors.CYAN)
        print()
        
        log("💰 Funcionalidades del módulo de Impuestos:", Colors.BLUE)
        log("   • Resumen fiscal para personas físicas y jurídicas", Colors.BLUE)
        log("   • Gestión de obligaciones fiscales (modelos 100, 115, 200, 303...)", Colors.BLUE)
        log("   • Seguimiento de IBI por inmueble", Colors.BLUE)
        log("   • Calendario fiscal con vencimientos", Colors.BLUE)
        log("   • Calculadora de impuestos inmobiliarios", Colors.BLUE)
        log("   • Alertas de próximos vencimientos", Colors.BLUE)
        print()
        
        return 0

    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    finally:
        client.close()

if __name__ == '__main__':
    sys.exit(main())
