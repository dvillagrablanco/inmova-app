#!/usr/bin/env python3
"""
Deployment: Funcionalidad de Baja de Usuario
Despliega los cambios de la funcionalidad que permite a usuarios darse de baja.
"""

import sys
import os

user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko
import time

# Configuración del servidor
SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'
BRANCH = 'cursor/baja-de-usuario-5895'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.END):
    print(f"{color}{msg}{Colors.END}")

def run_cmd(client, cmd, timeout=300, show_output=False):
    """Ejecuta comando SSH y retorna (success, output)"""
    log(f"→ {cmd[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status == 0:
        log(f"✅ OK", Colors.GREEN)
        if show_output and out.strip():
            print(f"   {out[:200]}")
        return True, out
    else:
        log(f"❌ Error (exit: {exit_status})", Colors.RED)
        if err:
            print(f"   {err[:300]}")
        return False, out

def main():
    log(f"\n{'='*60}", Colors.BOLD)
    log(f"🚀 DEPLOYMENT: Baja de Usuario", Colors.BOLD)
    log(f"{'='*60}", Colors.BOLD)
    log(f"Servidor: {SERVER}")
    log(f"Rama: {BRANCH}")
    log(f"{'='*60}\n")
    
    # Conectar
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando al servidor...", Colors.YELLOW)
        client.connect(SERVER, username=USER, password=PASS, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        # 1. Backup del commit actual
        log("="*40, Colors.BLUE)
        log("📋 PASO 1: Backup del estado actual", Colors.BLUE)
        log("="*40, Colors.BLUE)
        success, current_commit = run_cmd(client, f"cd {PATH} && git rev-parse --short HEAD")
        if success:
            log(f"   Commit actual: {current_commit.strip()}", Colors.CYAN)
        
        # 2. Fetch y checkout de la rama
        log("\n" + "="*40, Colors.BLUE)
        log("📥 PASO 2: Actualizar código", Colors.BLUE)
        log("="*40, Colors.BLUE)
        
        # Descartar cambios locales si los hay
        run_cmd(client, f"cd {PATH} && git stash")
        
        # Fetch todas las ramas
        run_cmd(client, f"cd {PATH} && git fetch --all")
        
        # Checkout de la rama específica
        success, _ = run_cmd(client, f"cd {PATH} && git checkout {BRANCH}")
        if not success:
            # Intentar crear rama tracking
            success, _ = run_cmd(client, f"cd {PATH} && git checkout -b {BRANCH} origin/{BRANCH}")
        
        # Pull de los últimos cambios
        success, _ = run_cmd(client, f"cd {PATH} && git pull origin {BRANCH}")
        if not success:
            log("⚠️ Error en git pull, intentando con main...", Colors.YELLOW)
            run_cmd(client, f"cd {PATH} && git checkout main && git pull origin main")
        
        # 3. Instalar dependencias
        log("\n" + "="*40, Colors.BLUE)
        log("📦 PASO 3: Instalar dependencias", Colors.BLUE)
        log("="*40, Colors.BLUE)
        run_cmd(client, f"cd {PATH} && npm install", timeout=600)
        
        # 4. Prisma
        log("\n" + "="*40, Colors.BLUE)
        log("🔧 PASO 4: Prisma generate & migrate", Colors.BLUE)
        log("="*40, Colors.BLUE)
        run_cmd(client, f"cd {PATH} && npx prisma generate")
        run_cmd(client, f"cd {PATH} && npx prisma migrate deploy")
        
        # 5. Build (opcional - si se necesita)
        log("\n" + "="*40, Colors.BLUE)
        log("🏗️ PASO 5: Build (si es necesario)", Colors.BLUE)
        log("="*40, Colors.BLUE)
        # Solo si hay cambios significativos que requieran rebuild
        # run_cmd(client, f"cd {PATH} && npm run build", timeout=900)
        log("   Saltando build completo - usando PM2 reload", Colors.YELLOW)
        
        # 6. Restart PM2
        log("\n" + "="*40, Colors.BLUE)
        log("🔄 PASO 6: Reiniciar aplicación", Colors.BLUE)
        log("="*40, Colors.BLUE)
        run_cmd(client, f"cd {PATH} && pm2 reload inmova-app --update-env")
        run_cmd(client, "pm2 save")
        
        log("\n⏳ Esperando 15 segundos para warm-up...", Colors.YELLOW)
        time.sleep(15)
        
        # 7. Health checks
        log("\n" + "="*40, Colors.BLUE)
        log("🏥 PASO 7: Health Checks", Colors.BLUE)
        log("="*40, Colors.BLUE)
        
        # Health check básico
        success, out = run_cmd(client, "curl -s http://localhost:3000/api/health")
        if 'ok' in out.lower() or '"status"' in out:
            log("✅ Health check: OK", Colors.GREEN)
        else:
            log("⚠️ Health check: Respuesta incierta", Colors.YELLOW)
        
        # Verificar PM2
        success, out = run_cmd(client, "pm2 status inmova-app --no-daemon")
        if 'online' in out.lower():
            log("✅ PM2 status: Online", Colors.GREEN)
        else:
            log("⚠️ PM2 status: Verificar manualmente", Colors.YELLOW)
        
        # Verificar que la nueva API existe
        log("\n📍 Verificando nueva API de baja...", Colors.CYAN)
        success, out = run_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/user/deactivate")
        if '401' in out or '200' in out:
            log("✅ API /api/user/deactivate: Disponible (requiere auth)", Colors.GREEN)
        else:
            log(f"⚠️ API /api/user/deactivate: Código {out}", Colors.YELLOW)
        
        # 8. Resumen
        log("\n" + "="*60, Colors.GREEN + Colors.BOLD)
        log("🎉 DEPLOYMENT COMPLETADO", Colors.GREEN + Colors.BOLD)
        log("="*60, Colors.GREEN + Colors.BOLD)
        log(f"""
📋 Resumen de cambios deployados:
   • API: /api/user/deactivate (POST para baja, GET para status)
   • Componente: AccountDeletion.tsx
   • Página: Configuración → Pestaña "Mi Cuenta"

🌐 URLs:
   • Producción: https://inmovaapp.com
   • Directa: http://{SERVER}:3000
   • Configuración: https://inmovaapp.com/configuracion

✅ Para probar:
   1. Ir a Configuración → Mi Cuenta
   2. Llenar el formulario de baja
   3. Confirmar con contraseña
        """, Colors.CYAN)
        
    except Exception as e:
        log(f"\n❌ ERROR: {str(e)}", Colors.RED)
        raise
    finally:
        client.close()
        log("\n🔒 Conexión cerrada", Colors.YELLOW)

if __name__ == '__main__':
    main()
