#!/usr/bin/env python3
"""
Script para desplegar la integración del Centro Financiero con Open Banking y Contabilidad
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración del servidor
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.RESET):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.RESET}")

def exec_cmd(client, command, timeout=300):
    """Ejecutar comando y retornar status y output"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode().strip()
    error = stderr.read().decode().strip()
    return exit_status, output, error

def main():
    print(f"""
{Colors.CYAN}{'='*70}
🚀 DEPLOYMENT - INTEGRACIÓN CENTRO FINANCIERO
{'='*70}{Colors.RESET}

Servidor: {SERVER_IP}
Path: {APP_PATH}
""")

    # Conectar
    log("🔐 Conectando al servidor...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error conectando: {e}", Colors.RED)
        return 1

    try:
        # 1. Actualizar código
        log("📥 Actualizando código desde GitHub...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git reset --hard origin/main", timeout=120)
        if status != 0:
            log(f"⚠️ Warning en git: {error}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)

        # 2. Instalar dependencias si hay cambios
        log("📦 Verificando dependencias...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --prefer-offline", timeout=300)
        if status != 0:
            log(f"⚠️ Warning en npm install: {error}", Colors.YELLOW)
        else:
            log("✅ Dependencias verificadas", Colors.GREEN)

        # 3. Generar Prisma
        log("🔧 Generando Prisma client...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        if status != 0:
            log(f"⚠️ Warning en Prisma: {error}", Colors.YELLOW)
        else:
            log("✅ Prisma generado", Colors.GREEN)

        # 4. Build
        log("🏗️ Compilando aplicación...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
        if status != 0:
            log(f"❌ Error en build: {error}", Colors.RED)
            log("Intentando limpiar cache y reintentar...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && rm -rf .next/cache", timeout=60)
            status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=600)
            if status != 0:
                log(f"❌ Build falló: {error}", Colors.RED)
                return 1
        log("✅ Build completado", Colors.GREEN)

        # 5. Reiniciar PM2
        log("♻️ Reiniciando aplicación...", Colors.CYAN)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app || pm2 start ecosystem.config.js", timeout=60)
        if status != 0:
            log(f"⚠️ Warning en PM2: {error}", Colors.YELLOW)
        else:
            log("✅ Aplicación reiniciada", Colors.GREEN)

        # 6. Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)

        # 7. Health checks
        log("🏥 Verificando health checks...", Colors.CYAN)
        
        routes_to_check = [
            ("/api/health", "Health API"),
            ("/finanzas", "Centro Financiero"),
            ("/finanzas/conciliacion", "Conciliación Bancaria"),
            ("/open-banking", "Open Banking"),
            ("/contabilidad/integraciones", "Contabilidad"),
        ]
        
        all_ok = True
        for route, name in routes_to_check:
            status, output, error = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:3000{route}", timeout=30)
            if output == "200":
                log(f"  ✅ {name}: OK", Colors.GREEN)
            else:
                log(f"  ❌ {name}: HTTP {output}", Colors.RED)
                all_ok = False

        if all_ok:
            print(f"""
{Colors.GREEN}{'='*70}
✅ DEPLOYMENT COMPLETADO EXITOSAMENTE
{'='*70}{Colors.RESET}

{Colors.BOLD}URLs de prueba:{Colors.RESET}
  • Centro Financiero: https://inmovaapp.com/finanzas
  • Conciliación Bancaria: https://inmovaapp.com/finanzas/conciliacion
  • Open Banking: https://inmovaapp.com/open-banking
  • Integraciones Contables: https://inmovaapp.com/contabilidad/integraciones

{Colors.BOLD}Funcionalidades integradas:{Colors.RESET}
  ✅ Centro Financiero conectado con Open Banking
  ✅ Centro Financiero conectado con Contabilidad
  ✅ Navegación bidireccional entre módulos
  ✅ Acciones rápidas actualizadas
""")
            return 0
        else:
            log("⚠️ Algunos health checks fallaron", Colors.YELLOW)
            return 1

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        return 1
    finally:
        client.close()
        log("🔒 Conexión cerrada", Colors.CYAN)

if __name__ == "__main__":
    exit(main())
