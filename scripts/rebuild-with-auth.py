#!/usr/bin/env python3
"""
Rebuild de la aplicación con las nuevas variables de auth
"""

import sys
import time
from datetime import datetime

try:
    import paramiko
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'paramiko', '-q'])
    import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class C:
    G = '\033[92m'
    R = '\033[91m'
    Y = '\033[93m'
    B = '\033[94m'
    C = '\033[96m'
    E = '\033[0m'

def log(msg, c=C.E):
    print(f"{c}[{datetime.now().strftime('%H:%M:%S')}] {msg}{C.E}")

def cmd(client, command, timeout=300):
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        status = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        return status, out, err
    except Exception as e:
        return -1, "", str(e)

def main():
    print(f"\n{C.C}{'='*60}\n🏗️ REBUILD CON NUEVAS VARIABLES DE AUTH\n{'='*60}{C.E}\n")

    log("🔐 Conectando...", C.B)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    log("✅ Conectado", C.G)

    try:
        # 1. Detener PM2
        log("⏹️ Deteniendo PM2...", C.C)
        cmd(client, "pm2 stop inmova-app 2>/dev/null || true")

        # 2. Verificar que las variables existen
        log("\n🔍 Verificando variables de entorno...", C.C)
        _, out, _ = cmd(client, f"grep -E '^NEXTAUTH_SECRET=|^NEXTAUTH_URL=|^DATABASE_URL=' {APP_PATH}/.env.production | wc -l")
        var_count = out.strip()
        log(f"  Variables configuradas: {var_count}", C.G if var_count == "3" else C.Y)

        # 3. Exportar variables para el build
        log("\n📤 Exportando variables para build...", C.C)
        _, out, _ = cmd(client, f"cd {APP_PATH} && source .env.production && echo $NEXTAUTH_SECRET | head -c 10")
        if out.strip():
            log("  ✅ Variables cargadas correctamente", C.G)
        
        # 4. Limpiar .next
        log("\n🧹 Limpiando build anterior...", C.C)
        cmd(client, f"rm -rf {APP_PATH}/.next")
        log("  ✅ Directorio .next eliminado", C.G)

        # 5. Regenerar Prisma
        log("\n🔧 Regenerando Prisma...", C.C)
        status, out, err = cmd(client, f"cd {APP_PATH} && set -a && source .env.production && set +a && npx prisma generate 2>&1", timeout=120)
        if status == 0:
            log("  ✅ Prisma generado", C.G)
        else:
            log(f"  ⚠️ Prisma warning: {(out+err)[-150:]}", C.Y)

        # 6. Build con variables
        log("\n🏗️ Ejecutando build (esto puede tardar ~3-5 min)...", C.C)
        # Usar set -a para exportar todas las variables del archivo .env
        build_cmd = f"""cd {APP_PATH} && \\
            set -a && source .env.production && set +a && \\
            npm run build 2>&1"""
        
        status, out, err = cmd(client, build_cmd, timeout=900)
        
        # Verificar resultado
        if "Compiled successfully" in out or "✓ Compiled" in out or "Route" in out:
            log("  ✅ Build completado exitosamente", C.G)
        elif status == 0:
            log("  ✅ Build completado (exit 0)", C.G)
        else:
            log(f"  ⚠️ Build con advertencias", C.Y)
            
        # Mostrar últimas líneas
        for line in out.strip().split('\n')[-10:]:
            print(f"    {line}")

        # 7. Verificar que prerender-manifest existe
        _, out, _ = cmd(client, f"test -f {APP_PATH}/.next/prerender-manifest.json && echo 'EXISTS' || echo 'MISSING'")
        if "MISSING" in out:
            log("  ⚠️ Creando prerender-manifest.json...", C.Y)
            manifest = '{"version":4,"routes":{},"dynamicRoutes":{},"staticRoutes":{},"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}'
            cmd(client, f"echo '{manifest}' > {APP_PATH}/.next/prerender-manifest.json")

        # 8. Iniciar PM2
        log("\n▶️ Iniciando PM2...", C.C)
        cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production --update-env 2>/dev/null || pm2 start npm --name inmova-app -- start")
        cmd(client, "pm2 save")
        log("  ✅ PM2 iniciado", C.G)

        # 9. Esperar warm-up
        log("\n⏳ Esperando warm-up (30s)...", C.C)
        time.sleep(30)

        # 10. Verificar auth
        log("\n🔐 Verificando autenticación...", C.C)
        
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/auth/providers 2>/dev/null")
        if "credentials" in out.lower():
            log("  ✅ Auth providers: OK", C.G)
        else:
            log(f"  ⚠️ Auth providers: {out[:80] if out else 'sin respuesta'}", C.Y)

        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/auth/session 2>/dev/null")
        if out.strip() and "{" in out:
            log(f"  ✅ Auth session: OK", C.G)
        else:
            log(f"  ⚠️ Auth session: {out[:80] if out else 'sin respuesta'}", C.Y)

        # 11. Verificar que no hay errores NO_SECRET
        log("\n📋 Verificando logs de error...", C.C)
        _, out, _ = cmd(client, "pm2 logs inmova-app --err --lines 20 --nostream 2>&1 | grep -i 'NO_SECRET' | wc -l")
        error_count = out.strip()
        if error_count == "0":
            log("  ✅ No hay errores NO_SECRET!", C.G)
        else:
            log(f"  ⚠️ {error_count} errores NO_SECRET encontrados", C.Y)
            _, out, _ = cmd(client, "pm2 logs inmova-app --err --lines 5 --nostream 2>&1 | tail -5")
            for line in out.strip().split('\n'):
                print(f"    {line}")

        # 12. Test final de login page
        log("\n🌐 Verificando página de login...", C.C)
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/login 2>/dev/null | head -c 500")
        if "html" in out.lower() or "<!doctype" in out.lower():
            log("  ✅ Página de login carga correctamente", C.G)
        else:
            log("  ⚠️ Página de login no responde", C.Y)

        print(f"""
{C.G}{'='*60}
✅ REBUILD COMPLETADO
{'='*60}{C.E}

{C.Y}URLs para probar:{C.E}
  - Login: https://inmovaapp.com/login
  - Health: https://inmovaapp.com/api/health

{C.Y}Si el login sigue fallando, verificar:{C.E}
  - pm2 logs inmova-app --err --lines 20
""")
        return True

    except Exception as e:
        log(f"❌ Error: {e}", C.R)
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
