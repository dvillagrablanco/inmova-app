#!/usr/bin/env python3
"""Diagnóstico de errores PM2 y verificación de .env.production"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

# Configuración
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=60):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace').strip()
    errors = stderr.read().decode('utf-8', errors='replace').strip()
    return exit_status, output, errors

def main():
    print(f"\n{Colors.CYAN}{'='*70}")
    print("🔍 DIAGNÓSTICO DE ERRORES PM2 - INMOVA APP")
    print(f"{'='*70}{Colors.RESET}\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("Conectando al servidor...", Colors.BLUE)
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=15)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Ver logs de error de PM2
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("📋 LOGS DE ERROR PM2")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, "pm2 logs inmova-app --err --lines 50 --nostream 2>/dev/null || pm2 logs --err --lines 50 --nostream")
        print(output if output else errors if errors else "Sin logs de error")
        
        # 2. Ver status de PM2
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("📊 STATUS PM2")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, "pm2 status")
        print(output if output else "No hay procesos PM2")
        
        # 3. Ver .env.production actual
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("🔐 VARIABLES DE ENTORNO (.env.production)")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, f"cat {APP_PATH}/.env.production 2>/dev/null | grep -v 'PASSWORD\\|SECRET\\|KEY' | head -50")
        if output:
            print("Variables configuradas (sin secrets):")
            print(output)
        else:
            log("⚠️ No se encontró .env.production o está vacío", Colors.RED)
        
        # 4. Verificar variables críticas
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("✅ VERIFICACIÓN DE VARIABLES CRÍTICAS")
        print(f"{'='*70}{Colors.RESET}\n")
        
        critical_vars = [
            "DATABASE_URL",
            "NEXTAUTH_URL",
            "NEXTAUTH_SECRET",
            "NODE_ENV",
            "PORT",
            "STRIPE_SECRET_KEY",
            "SMTP_HOST",
            "AWS_ACCESS_KEY_ID",
            "ANTHROPIC_API_KEY"
        ]
        
        for var in critical_vars:
            status, output, errors = exec_cmd(client, f"grep -q '^{var}=' {APP_PATH}/.env.production && echo 'FOUND' || echo 'MISSING'")
            if "FOUND" in output:
                # Verificar si tiene valor
                status2, val, _ = exec_cmd(client, f"grep '^{var}=' {APP_PATH}/.env.production | cut -d'=' -f2 | head -c 20")
                if val and val.strip() and val.strip() not in ['""', "''", '']:
                    log(f"✅ {var}: configurado", Colors.GREEN)
                else:
                    log(f"⚠️ {var}: definido pero VACÍO", Colors.YELLOW)
            else:
                log(f"❌ {var}: FALTA", Colors.RED)
        
        # 5. Verificar DATABASE_URL específicamente
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("🗄️ VERIFICACIÓN DATABASE_URL")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, f"grep '^DATABASE_URL=' {APP_PATH}/.env.production")
        if "dummy" in output.lower() or "placeholder" in output.lower() or "localhost" not in output:
            log("⚠️ DATABASE_URL puede ser un placeholder o estar mal configurada", Colors.YELLOW)
            print(f"Valor actual (parcial): {output[:80]}...")
        else:
            log("✅ DATABASE_URL parece estar configurada correctamente", Colors.GREEN)
        
        # 6. Verificar si la BD está corriendo
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("🐘 ESTADO POSTGRESQL")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, "systemctl status postgresql --no-pager 2>/dev/null || service postgresql status 2>/dev/null || echo 'PostgreSQL no encontrado como servicio'")
        if "active (running)" in output.lower():
            log("✅ PostgreSQL está corriendo", Colors.GREEN)
        else:
            log("⚠️ PostgreSQL puede no estar corriendo", Colors.YELLOW)
            print(output[:500])
        
        # 7. Verificar puerto 3000
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("🔌 VERIFICACIÓN DE PUERTOS")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, "netstat -tlnp | grep :3000 || ss -tlnp | grep :3000 || echo 'Puerto 3000 no está en uso'")
        print(output if output else "Puerto 3000 no está en uso")
        
        # 8. Ver últimos logs de la app
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("📜 ÚLTIMOS LOGS DE LA APLICACIÓN (stdout)")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, "pm2 logs inmova-app --out --lines 30 --nostream 2>/dev/null || tail -30 /var/log/inmova/out.log 2>/dev/null || echo 'No hay logs disponibles'")
        print(output if output else "Sin logs de salida")
        
        # 9. Verificar ecosystem.config.js
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("⚙️ ECOSYSTEM.CONFIG.JS")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, f"cat {APP_PATH}/ecosystem.config.js 2>/dev/null || echo 'No existe ecosystem.config.js'")
        print(output[:1000] if output else "No encontrado")
        
        # 10. Verificar node y npm
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("🔧 VERSIONES DE NODE/NPM")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, "node --version && npm --version")
        print(output if output else errors)
        
        # 11. Verificar si existe .next
        print(f"\n{Colors.YELLOW}{'='*70}")
        print("📁 VERIFICACIÓN DE BUILD (.next)")
        print(f"{'='*70}{Colors.RESET}\n")
        
        status, output, errors = exec_cmd(client, f"ls -la {APP_PATH}/.next 2>/dev/null | head -10 || echo '.next no existe - falta build'")
        print(output)
        
        print(f"\n{Colors.CYAN}{'='*70}")
        print("🔍 DIAGNÓSTICO COMPLETADO")
        print(f"{'='*70}{Colors.RESET}\n")
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
