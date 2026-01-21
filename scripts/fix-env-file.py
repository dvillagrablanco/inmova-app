#!/usr/bin/env python3
"""
Arreglar archivo .env.production directamente
"""

import sys
import time
import secrets
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
    print(f"\n{C.C}{'='*60}\n🔧 ARREGLAR .env.production DIRECTAMENTE\n{'='*60}{C.E}\n")

    log("🔐 Conectando...", C.B)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    log("✅ Conectado", C.G)

    try:
        # 1. Ver contenido actual del .env.production
        log("\n📄 Contenido actual de .env.production:", C.C)
        _, out, _ = cmd(client, f"cat {APP_PATH}/.env.production 2>/dev/null | head -30")
        print(out[:1500])

        # 2. Generar nuevos valores
        nextauth_secret = secrets.token_hex(32)
        nextauth_url = "https://inmovaapp.com"
        database_url = "postgresql://inmova_user:InmovaApp2024!@localhost:5432/inmova_production?schema=public"

        # 3. Crear archivo .env.production correcto
        log("\n📝 Creando nuevo .env.production...", C.C)
        
        env_content = f'''# Archivo de configuración de producción - Inmova App
# Generado el {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

# NextAuth Configuration
NEXTAUTH_SECRET="{nextauth_secret}"
NEXTAUTH_URL="{nextauth_url}"

# Database
DATABASE_URL="{database_url}"

# Node Environment
NODE_ENV="production"

# App Configuration
PORT=3000
'''

        # Backup del archivo actual
        cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.$(date +%s) 2>/dev/null || true")

        # Escribir nuevo archivo
        # Escapar caracteres especiales para el comando shell
        escaped_content = env_content.replace("'", "'\\''")
        cmd(client, f"cat > {APP_PATH}/.env.production << 'ENVEOF'\n{env_content}\nENVEOF")
        
        log("  ✅ Archivo creado", C.G)

        # 4. Verificar contenido
        log("\n🔍 Verificando nuevo contenido:", C.C)
        _, out, _ = cmd(client, f"cat {APP_PATH}/.env.production")
        print(out)

        # 5. Verificar que las variables están presentes
        _, out, _ = cmd(client, f"grep -c -E '^NEXTAUTH_SECRET=|^NEXTAUTH_URL=|^DATABASE_URL=' {APP_PATH}/.env.production")
        log(f"  Variables encontradas: {out.strip()}/3", C.G if out.strip() == "3" else C.Y)

        # 6. Detener PM2
        log("\n⏹️ Deteniendo PM2...", C.C)
        cmd(client, "pm2 stop inmova-app 2>/dev/null || true")

        # 7. Limpiar .next
        log("🧹 Limpiando .next...", C.C)
        cmd(client, f"rm -rf {APP_PATH}/.next")

        # 8. Regenerar Prisma con las nuevas variables
        log("🔧 Regenerando Prisma...", C.C)
        status, out, err = cmd(client, f"cd {APP_PATH} && export $(cat .env.production | xargs) && npx prisma generate 2>&1", timeout=120)
        if status == 0:
            log("  ✅ Prisma generado", C.G)
        else:
            log(f"  ⚠️ Prisma: {(out+err)[-150:]}", C.Y)

        # 9. Build
        log("\n🏗️ Ejecutando build (~3-5 min)...", C.C)
        status, out, err = cmd(client, f"cd {APP_PATH} && export $(cat .env.production | grep -v '#' | xargs) && npm run build 2>&1", timeout=900)
        
        if "Compiled" in out or status == 0:
            log("  ✅ Build completado", C.G)
        else:
            log(f"  ⚠️ Build warning: {(out+err)[-200:]}", C.Y)

        # 10. Crear prerender-manifest si no existe
        _, out, _ = cmd(client, f"test -f {APP_PATH}/.next/prerender-manifest.json && echo 'EXISTS' || echo 'MISSING'")
        if "MISSING" in out:
            manifest = '{"version":4,"routes":{},"dynamicRoutes":{},"staticRoutes":{},"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}'
            cmd(client, f"echo '{manifest}' > {APP_PATH}/.next/prerender-manifest.json")
            log("  ✅ prerender-manifest.json creado", C.G)

        # 11. Iniciar PM2 con las variables de entorno
        log("\n▶️ Iniciando PM2...", C.C)
        # Cargar variables explícitamente
        cmd(client, f"cd {APP_PATH} && export $(cat .env.production | grep -v '#' | xargs) && pm2 start ecosystem.config.js --env production --update-env 2>/dev/null || pm2 start npm --name inmova-app -- start")
        cmd(client, "pm2 save")
        log("  ✅ PM2 iniciado", C.G)

        # 12. Esperar
        log("\n⏳ Esperando warm-up (35s)...", C.C)
        time.sleep(35)

        # 13. Verificar auth
        log("\n🔐 Verificando autenticación...", C.C)
        
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/auth/providers 2>/dev/null")
        if "credentials" in out.lower():
            log("  ✅ Auth providers: OK!", C.G)
        elif out.strip():
            log(f"  ⚠️ Auth providers responde: {out[:100]}", C.Y)
        else:
            log("  ❌ Auth providers sin respuesta", C.R)

        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/auth/session 2>/dev/null")
        if out.strip() and "{" in out:
            log(f"  ✅ Auth session: OK!", C.G)
        else:
            log(f"  ⚠️ Auth session: {out[:100] if out else 'sin respuesta'}", C.Y)

        # 14. Verificar errores
        log("\n📋 Verificando logs de error...", C.C)
        _, out, _ = cmd(client, "pm2 logs inmova-app --err --lines 10 --nostream 2>&1 | grep -i 'NO_SECRET' | wc -l")
        if out.strip() == "0":
            log("  ✅ No hay errores NO_SECRET!", C.G)
        else:
            log(f"  ⚠️ {out.strip()} errores NO_SECRET", C.Y)
            _, logs, _ = cmd(client, "pm2 logs inmova-app --err --lines 5 --nostream")
            for line in logs.strip().split('\n')[-5:]:
                print(f"    {line}")

        # 15. Health check
        log("\n🏥 Health check...", C.C)
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/health 2>/dev/null")
        if '"status":"ok"' in out:
            log("  ✅ Health: OK", C.G)
        else:
            log(f"  ⚠️ Health: {out[:100] if out else 'sin respuesta'}", C.Y)

        print(f"""
{C.G}{'='*60}
✅ CONFIGURACIÓN COMPLETADA
{'='*60}{C.E}

{C.Y}Prueba el login en:{C.E}
  https://inmovaapp.com/login

{C.Y}Si sigue fallando, revisar logs:{C.E}
  ssh root@{SERVER_IP} 'pm2 logs inmova-app --err --lines 30'
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
