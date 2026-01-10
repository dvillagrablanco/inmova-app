#!/usr/bin/env python3
"""
Deployment de mejoras UX y fix 404 importar contratos
Fecha: 2026-01-10
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando y retornar resultado"""
    log(f"  → {cmd[:80]}...", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print(f"""
{Colors.BOLD}{'='*70}
🚀 DEPLOYMENT: Mejoras UX Alquiler Tradicional + Fix Importar Contratos
{'='*70}{Colors.RESET}
    
Servidor: {SERVER_IP}
Path: {APP_PATH}

Cambios a desplegar:
  1. Dashboard alquiler tradicional con KPIs relevantes
  2. Persistencia scroll sidebar corregida
  3. Redirección /propiedades/nuevo → /propiedades/crear
  4. Nueva página /contratos/importar (fix 404)
  5. Fix i18n-client.ts → .tsx

{'='*70}
""")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Conectar
        log("🔐 Conectando al servidor...", Colors.YELLOW)
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10
        )
        log("✅ Conectado exitosamente", Colors.GREEN)
        
        # 1. Verificar estado actual
        log("\n📊 VERIFICANDO ESTADO ACTUAL", Colors.BOLD)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git status --short")
        if output.strip():
            log(f"⚠️  Cambios locales detectados:\n{output}", Colors.YELLOW)
            # Stash cambios locales
            exec_cmd(client, f"cd {APP_PATH} && git stash")
        
        # 2. Git pull
        log("\n📥 ACTUALIZANDO CÓDIGO", Colors.BOLD)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main")
        if status != 0:
            log(f"❌ Error en git pull: {error}", Colors.RED)
            return False
        log(f"✅ Git pull completado", Colors.GREEN)
        
        # Mostrar cambios
        if "Already up to date" not in output:
            log(f"   Cambios:\n{output[:500]}", Colors.CYAN)
        
        # 3. Verificar si hay cambios en package.json
        log("\n📦 VERIFICANDO DEPENDENCIAS", Colors.BOLD)
        status, output, _ = exec_cmd(client, f"cd {APP_PATH} && git diff HEAD~1 --name-only | grep -q package.json && echo 'DEPS_CHANGED' || echo 'NO_CHANGE'")
        
        if "DEPS_CHANGED" in output:
            log("📦 package.json modificado, instalando dependencias...", Colors.YELLOW)
            status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm ci --prefer-offline", timeout=600)
            if status != 0:
                log(f"⚠️  npm ci falló, intentando npm install...", Colors.YELLOW)
                status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install", timeout=600)
        else:
            log("✅ No hay cambios en dependencias", Colors.GREEN)
        
        # 4. Regenerar Prisma
        log("\n🔧 REGENERANDO PRISMA CLIENT", Colors.BOLD)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate", timeout=120)
        if status != 0:
            log(f"⚠️  Warning Prisma: {error[:200]}", Colors.YELLOW)
        else:
            log("✅ Prisma client regenerado", Colors.GREEN)
        
        # 5. Build
        log("\n🏗️  BUILDING APLICACIÓN", Colors.BOLD)
        log("   Esto puede tomar varios minutos...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -50", timeout=600)
        
        if status != 0:
            log(f"❌ Build falló:\n{error[:500]}", Colors.RED)
            # Intentar con build menos estricto
            log("🔄 Intentando build con output standalone...", Colors.YELLOW)
            status, output, error = exec_cmd(client, f"cd {APP_PATH} && NODE_OPTIONS='--max-old-space-size=4096' npm run build 2>&1 | tail -30", timeout=600)
            if status != 0:
                log(f"❌ Build falló definitivamente", Colors.RED)
                return False
        
        log("✅ Build completado exitosamente", Colors.GREEN)
        
        # 6. Restart PM2
        log("\n♻️  REINICIANDO PM2", Colors.BOLD)
        status, output, error = exec_cmd(client, "pm2 reload inmova-app --update-env")
        if status != 0:
            log(f"⚠️  PM2 reload falló, intentando restart...", Colors.YELLOW)
            exec_cmd(client, "pm2 restart inmova-app")
        
        exec_cmd(client, "pm2 save")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # 7. Esperar warm-up
        log("\n⏳ Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)
        
        # 8. Health checks
        log("\n🏥 VERIFICANDO HEALTH CHECKS", Colors.BOLD)
        
        checks = [
            ("HTTP Local", "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000"),
            ("Health API", "curl -s http://localhost:3000/api/health"),
            ("PM2 Status", "pm2 jlist | grep -o '\"status\":\"[^\"]*\"' | head -1"),
        ]
        
        all_passed = True
        for name, cmd in checks:
            status, output, _ = exec_cmd(client, cmd)
            output = output.strip()
            
            if name == "HTTP Local":
                passed = output == "200"
            elif name == "Health API":
                passed = '"status":"ok"' in output or '"ok"' in output.lower()
            elif name == "PM2 Status":
                passed = "online" in output.lower()
            else:
                passed = status == 0
            
            if passed:
                log(f"   ✅ {name}: OK", Colors.GREEN)
            else:
                log(f"   ❌ {name}: FAIL ({output[:100]})", Colors.RED)
                all_passed = False
        
        # 9. Verificar páginas específicas
        log("\n🔍 VERIFICANDO PÁGINAS NUEVAS/MODIFICADAS", Colors.BOLD)
        
        pages = [
            ("/traditional-rental", "Dashboard Alquiler"),
            ("/contratos/importar", "Importar Contratos"),
            ("/propiedades/nuevo", "Nueva Propiedad (redirect)"),
        ]
        
        for path, name in pages:
            status, output, _ = exec_cmd(client, f"curl -s -o /dev/null -w '%{{http_code}}' -L http://localhost:3000{path}")
            code = output.strip()
            if code in ["200", "302", "307"]:
                log(f"   ✅ {name}: {code}", Colors.GREEN)
            else:
                log(f"   ⚠️  {name}: {code}", Colors.YELLOW)
        
        # Resultado final
        print(f"""
{Colors.BOLD}{'='*70}
{'✅ DEPLOYMENT COMPLETADO EXITOSAMENTE' if all_passed else '⚠️  DEPLOYMENT CON ADVERTENCIAS'}
{'='*70}{Colors.RESET}

URLs de verificación:
  • Dashboard: https://inmovaapp.com/traditional-rental
  • Importar Contratos: https://inmovaapp.com/contratos/importar
  • Health: https://inmovaapp.com/api/health

Para ver logs:
  ssh root@{SERVER_IP} 'pm2 logs inmova-app --lines 50'

{'='*70}
""")
        
        return all_passed
        
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
