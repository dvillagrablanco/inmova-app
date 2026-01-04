#!/usr/bin/env python3
"""
Fix automatizado para rutas 404 en producción
Hace rebuild completo y verifica que las páginas funcionan
"""

import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Paramiko no disponible")
    sys.exit(1)

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_DIR = '/opt/inmova-app'

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log(message, color=Colors.CYAN):
    print(f"{color}[{time.strftime('%H:%M:%S')}] {message}{Colors.END}")

def exec_cmd(client, command, timeout=600):
    """Ejecutar comando con timeout largo para build"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    log("=" * 70, Colors.BOLD)
    log("🔧 FIX AUTOMÁTICO PARA RUTAS 404", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        # PASO 1: Git status actual
        log("=" * 70, Colors.BOLD)
        log("📁 PASO 1: ESTADO ACTUAL", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        status, output, _ = exec_cmd(client, f"cd {APP_DIR} && git log -1 --oneline")
        log(f"Commit actual: {output.strip()}", Colors.CYAN)
        
        status, output, _ = exec_cmd(client, f"cd {APP_DIR} && stat -c '%y' .next/BUILD_ID 2>/dev/null || echo 'No BUILD_ID'")
        log(f"Último build: {output.strip()}", Colors.CYAN)
        print()
        
        # PASO 2: Pull latest code
        log("=" * 70, Colors.BOLD)
        log("📥 PASO 2: ACTUALIZAR CÓDIGO", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        log("Haciendo git pull...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_DIR} && git pull origin main")
        
        if status != 0:
            if 'Already up to date' in output:
                log("  ✅ Código ya actualizado", Colors.GREEN)
            else:
                log(f"  ⚠️  Warning: {output}", Colors.YELLOW)
        else:
            log("  ✅ Código actualizado", Colors.GREEN)
        print()
        
        # PASO 3: Limpiar build anterior
        log("=" * 70, Colors.BOLD)
        log("🧹 PASO 3: LIMPIAR BUILD ANTERIOR", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        log("Eliminando .next/cache y .next/server...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_DIR} && rm -rf .next/cache .next/server")
        log("  ✅ Cache limpiado", Colors.GREEN)
        print()
        
        # PASO 4: Regenerar Prisma
        log("=" * 70, Colors.BOLD)
        log("🔧 PASO 4: REGENERAR PRISMA CLIENT", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        log("Generando Prisma Client...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_DIR} && npx prisma generate", timeout=120)
        
        if status == 0:
            log("  ✅ Prisma Client generado", Colors.GREEN)
        else:
            log(f"  ⚠️  Warning: {error[:200]}", Colors.YELLOW)
        print()
        
        # PASO 5: Build completo
        log("=" * 70, Colors.BOLD)
        log("🏗️  PASO 5: BUILD DE NEXT.JS", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        log("Iniciando npm run build (puede tardar 3-5 min)...", Colors.CYAN)
        log("⏳ Esperando...", Colors.YELLOW)
        
        status, output, error = exec_cmd(client, f"cd {APP_DIR} && npm run build", timeout=600)
        
        if status == 0:
            log("  ✅ Build completado exitosamente", Colors.GREEN)
        else:
            log(f"  ❌ Error en build:", Colors.RED)
            log(f"     {error[:500]}", Colors.RED)
            return 1
        print()
        
        # PASO 6: Verificar páginas compiladas
        log("=" * 70, Colors.BOLD)
        log("🔍 PASO 6: VERIFICAR PÁGINAS COMPILADAS", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        log("Buscando páginas en .next/server/app/...", Colors.CYAN)
        status, output, _ = exec_cmd(
            client,
            f"find {APP_DIR}/.next/server/app -name 'page.js' | grep -E '(admin|candidatos|usuarios|propiedades)' | head -10"
        )
        
        if output.strip():
            pages_found = len(output.strip().split('\n'))
            log(f"  ✅ Encontradas {pages_found} páginas críticas:", Colors.GREEN)
            for line in output.strip().split('\n')[:5]:
                page_name = line.split('/')[-2]
                log(f"    • /{page_name}", Colors.GREEN)
        else:
            log("  ⚠️  No se encontraron páginas compiladas", Colors.YELLOW)
        print()
        
        # PASO 7: Reload PM2
        log("=" * 70, Colors.BOLD)
        log("⚡ PASO 7: RELOAD PM2 (ZERO-DOWNTIME)", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        log("Haciendo PM2 reload...", Colors.CYAN)
        exec_cmd(client, f"pm2 reload inmova-app")
        log("  ✅ PM2 reloaded", Colors.GREEN)
        print()
        
        # PASO 8: Wait for warm-up
        log("⏳ Esperando 20s para warm-up...", Colors.YELLOW)
        time.sleep(20)
        print()
        
        # PASO 9: Verificar rutas
        log("=" * 70, Colors.BOLD)
        log("🧪 PASO 8: VERIFICAR RUTAS CRÍTICAS", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        test_routes = [
            '/admin',
            '/candidatos',
            '/usuarios',
            '/propiedades',
            '/inquilinos',
        ]
        
        routes_ok = 0
        routes_error = 0
        
        for route in test_routes:
            status, output, _ = exec_cmd(
                client,
                f"curl -s -I http://localhost:3000{route} | head -1"
            )
            
            http_status = output.strip().split()[1] if len(output.strip().split()) > 1 else 'ERROR'
            
            if http_status == '200':
                routes_ok += 1
                log(f"  ✅ {route}: HTTP 200", Colors.GREEN)
            else:
                routes_error += 1
                log(f"  ❌ {route}: HTTP {http_status}", Colors.RED)
        
        print()
        
        # REPORTE FINAL
        log("=" * 70, Colors.BOLD)
        log("📊 REPORTE FINAL", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        log(f"Rutas verificadas: {len(test_routes)}", Colors.CYAN)
        log(f"  ✅ OK: {routes_ok}", Colors.GREEN)
        log(f"  ❌ Error: {routes_error}", Colors.RED)
        print()
        
        if routes_error == 0:
            log("=" * 70, Colors.GREEN)
            log("✅ FIX COMPLETADO EXITOSAMENTE", Colors.GREEN)
            log("=" * 70, Colors.GREEN)
            print()
            log("URLs accesibles:", Colors.GREEN)
            log("  • https://inmovaapp.com/admin", Colors.CYAN)
            log("  • https://inmovaapp.com/candidatos", Colors.CYAN)
            log("  • https://inmovaapp.com/usuarios", Colors.CYAN)
            log("  • https://inmovaapp.com/propiedades", Colors.CYAN)
            return 0
        else:
            log("=" * 70, Colors.RED)
            log(f"⚠️  FIX PARCIAL - {routes_error} rutas con errores", Colors.RED)
            log("=" * 70, Colors.RED)
            return 1
    
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        client.close()

if __name__ == '__main__':
    sys.exit(main())
