#!/usr/bin/env python3
"""
Diagnóstico y Deployment a producción vía SSH (Paramiko)
"""

import sys
import time
from datetime import datetime

import paramiko

# Configuración
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

def log(msg, color=Colors.RESET):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300, check_error=False):
    """Ejecutar comando SSH y retornar resultado"""
    log(f"  → {cmd[:100]}..." if len(cmd) > 100 else f"  → {cmd}", Colors.CYAN)
    
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status != 0 and check_error:
        log(f"  ⚠️ Exit code: {exit_status}", Colors.YELLOW)
        if error:
            log(f"  Error: {error[:300]}", Colors.RED)
    
    return exit_status, output, error

def main():
    print(f"""
{Colors.BOLD}{'='*70}
🔍 DIAGNÓSTICO Y DEPLOYMENT - INMOVA APP
{'='*70}{Colors.RESET}

Servidor: {SERVER_IP}
Path: {APP_PATH}
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

""")

    # Conectar
    log("🔐 Conectando al servidor...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log("✅ Conectado exitosamente", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        # =====================================================
        # PASO 1: DIAGNÓSTICO
        # =====================================================
        print(f"\n{Colors.BOLD}🔍 PASO 1: DIAGNÓSTICO DEL SERVIDOR{Colors.RESET}")
        
        # Verificar estado de PM2
        log("Verificando PM2...", Colors.CYAN)
        status, output, _ = exec_cmd(client, "pm2 list 2>&1")
        print(output[:500] if output else "Sin salida")
        
        # Verificar si la app está corriendo
        log("Verificando proceso de la app...", Colors.CYAN)
        status, output, _ = exec_cmd(client, "pm2 jlist 2>/dev/null | grep -o '\"status\":\"[^\"]*\"' | head -3")
        print(f"    Estado PM2: {output.strip() if output.strip() else 'No encontrado'}")
        
        # Verificar directorio de la app
        log("Verificando directorio de la app...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f"ls -la {APP_PATH} 2>&1 | head -10")
        if "No such file" in output or status != 0:
            log(f"❌ Directorio {APP_PATH} no existe!", Colors.RED)
        else:
            print(output[:300])
        
        # Verificar .cursorrules si existe
        log("Verificando .cursorrules...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f"ls -la {APP_PATH}/.cursorrules 2>&1")
        if "No such file" in output:
            log("ℹ️ .cursorrules no existe (normal)", Colors.YELLOW)
        else:
            log("✅ .cursorrules existe", Colors.GREEN)
            # Verificar tamaño
            status, size_output, _ = exec_cmd(client, f"wc -c {APP_PATH}/.cursorrules 2>&1")
            log(f"    Tamaño: {size_output.strip()}", Colors.CYAN)
        
        # Verificar git status
        log("Verificando estado de git...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git status --short 2>&1 | head -10")
        if output.strip():
            print(f"    Cambios locales:\n{output[:300]}")
        else:
            log("    Sin cambios locales", Colors.GREEN)
        
        # Verificar rama actual
        log("Verificando rama actual...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git branch --show-current 2>&1")
        current_branch = output.strip()
        log(f"    Rama actual: {current_branch}", Colors.CYAN)
        
        # Verificar health check
        log("Verificando health check...", Colors.CYAN)
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health 2>&1")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:100]}", Colors.YELLOW)

        # =====================================================
        # PASO 2: CORREGIR PROBLEMAS
        # =====================================================
        print(f"\n{Colors.BOLD}🔧 PASO 2: CORRIGIENDO PROBLEMAS{Colors.RESET}")
        
        # Limpiar cambios locales si los hay
        log("Limpiando cambios locales...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && git stash 2>/dev/null || true")
        exec_cmd(client, f"cd {APP_PATH} && git checkout -- . 2>/dev/null || true")
        
        # Fetch y checkout a main
        log("Actualizando desde repositorio...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && git fetch origin 2>&1")
        
        # Verificar si main existe
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git branch -a | grep -E 'main|master' | head -1")
        main_branch = "main" if "main" in output else "master"
        log(f"    Usando rama: {main_branch}", Colors.CYAN)
        
        # Checkout a main y pull
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git checkout {main_branch} 2>&1")
        if status != 0:
            log(f"⚠️ Error en checkout: {error[:200]}", Colors.YELLOW)
            # Forzar reset
            exec_cmd(client, f"cd {APP_PATH} && git reset --hard origin/{main_branch} 2>&1")
        
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git pull origin {main_branch} 2>&1")
        log(f"    Pull: {output.split(chr(10))[0] if output else 'OK'}", Colors.GREEN)

        # =====================================================
        # PASO 3: INSTALACIÓN Y BUILD
        # =====================================================
        print(f"\n{Colors.BOLD}📦 PASO 3: INSTALACIÓN Y BUILD{Colors.RESET}")
        
        # Guardar commit actual
        status, current_commit, _ = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        current_commit = current_commit.strip()
        log(f"✅ Commit: {current_commit}", Colors.GREEN)
        
        # npm install
        log("Instalando dependencias (puede tardar)...", Colors.YELLOW)
        status, output, error = exec_cmd(client, 
            f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -10",
            timeout=600
        )
        if status == 0:
            log("✅ Dependencias instaladas", Colors.GREEN)
        else:
            log(f"⚠️ npm install tuvo warnings", Colors.YELLOW)
        
        # Prisma generate
        log("Generando Prisma client...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3")
        
        # Build
        log("⏳ Construyendo aplicación (3-5 min)...", Colors.YELLOW)
        status, output, error = exec_cmd(client, 
            f"cd {APP_PATH} && npm run build 2>&1",
            timeout=600
        )
        
        if status != 0:
            log("❌ Error en build!", Colors.RED)
            # Mostrar últimos errores
            error_lines = (output + error).split('\n')[-20:]
            for line in error_lines:
                if line.strip():
                    print(f"    {line}")
            return 1
        
        log("✅ Build completado", Colors.GREEN)

        # =====================================================
        # PASO 4: RESTART Y VERIFICACIÓN
        # =====================================================
        print(f"\n{Colors.BOLD}♻️ PASO 4: REINICIO Y VERIFICACIÓN{Colors.RESET}")
        
        # Reload PM2
        log("Reiniciando PM2...", Colors.CYAN)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1")
        if status != 0:
            log("⚠️ Reload falló, intentando restart...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && pm2 restart inmova-app --update-env 2>&1")
        
        exec_cmd(client, "pm2 save 2>/dev/null || true")
        
        log("⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # Health checks
        log("Verificando health...", Colors.CYAN)
        
        # HTTP check
        status, output, _ = exec_cmd(client, 
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health"
        )
        if "200" in output:
            log("✅ HTTP 200 OK", Colors.GREEN)
        else:
            log(f"⚠️ HTTP: {output}", Colors.YELLOW)
        
        # API check
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ API Health OK", Colors.GREEN)
        else:
            log(f"⚠️ API: {output[:100]}", Colors.YELLOW)
        
        # PM2 check
        status, output, _ = exec_cmd(client, "pm2 jlist 2>/dev/null | grep -o '\"status\":\"online\"' | wc -l")
        online_count = int(output.strip()) if output.strip().isdigit() else 0
        if online_count > 0:
            log(f"✅ PM2: {online_count} instancias online", Colors.GREEN)
        else:
            log("⚠️ PM2: sin instancias online", Colors.YELLOW)

        # =====================================================
        # RESUMEN
        # =====================================================
        print(f"""
{Colors.BOLD}{'='*70}
✅ DEPLOYMENT COMPLETADO
{'='*70}{Colors.RESET}

{Colors.GREEN}URL Principal:{Colors.RESET} https://inmovaapp.com
{Colors.GREEN}URL Directa:{Colors.RESET} http://{SERVER_IP}:3000
{Colors.GREEN}Health Check:{Colors.RESET} https://inmovaapp.com/api/health

{Colors.CYAN}Commit desplegado:{Colors.RESET} {current_commit}
{Colors.CYAN}Rama:{Colors.RESET} {main_branch}

{Colors.YELLOW}Para ver logs:{Colors.RESET}
  ssh root@{SERVER_IP} 'pm2 logs inmova-app'

{'='*70}
""")

        return 0

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        client.close()
        log("🔌 Conexión SSH cerrada", Colors.CYAN)

if __name__ == "__main__":
    sys.exit(main())
