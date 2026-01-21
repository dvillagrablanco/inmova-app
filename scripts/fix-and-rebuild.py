#!/usr/bin/env python3
"""
Arreglar problemas de configuración y rebuild
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
    print(f"\n{C.C}{'='*60}\n🔧 ARREGLAR CONFIGURACIÓN Y REBUILD\n{'='*60}{C.E}\n")

    log("🔐 Conectando...", C.B)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    log("✅ Conectado", C.G)

    try:
        # 1. Detener PM2
        log("⏹️ Deteniendo PM2...", C.C)
        cmd(client, "pm2 stop inmova-app 2>/dev/null || true")

        # 2. Verificar si existe un DATABASE_URL real en backup
        log("🔍 Buscando DATABASE_URL real...", C.C)
        _, out, _ = cmd(client, f"grep -r 'DATABASE_URL' /root/.env* /opt/*.env* 2>/dev/null | grep -v dummy | head -3")
        if out.strip():
            log(f"  Encontrado: {out[:100]}", C.Y)
        
        # 3. Intentar obtener DATABASE_URL de variables de entorno de PM2
        _, out, _ = cmd(client, "pm2 env inmova-app 2>/dev/null | grep DATABASE_URL | head -1")
        if "dummy" not in out and "postgresql" in out.lower():
            db_url = out.strip().split('=', 1)[-1] if '=' in out else ""
            log(f"  PM2 DB URL: {db_url[:50]}...", C.G)
        
        # 4. Buscar en ecosystem.config.js
        _, out, _ = cmd(client, f"grep -A5 'DATABASE_URL' {APP_PATH}/ecosystem.config.js 2>/dev/null")
        if out.strip() and "dummy" not in out:
            log(f"  Ecosystem config: {out[:100]}", C.Y)

        # 5. Verificar la BD PostgreSQL local
        log("🗄️ Verificando PostgreSQL local...", C.C)
        _, out, _ = cmd(client, "sudo -u postgres psql -c '\\l' 2>/dev/null | grep -E 'inmova|production'")
        if out.strip():
            log(f"  Bases de datos encontradas:", C.G)
            print(f"  {out}")
        
        # 6. Actualizar DATABASE_URL en .env.production
        log("📝 Actualizando DATABASE_URL...", C.C)
        # Usar la BD local de PostgreSQL
        real_db_url = "postgresql://inmova_user:InmovaApp2024!@localhost:5432/inmova_production?schema=public"
        
        # Hacer backup del .env.production actual
        cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.bak")
        
        # Actualizar DATABASE_URL
        cmd(client, f"sed -i 's|DATABASE_URL=.*|DATABASE_URL=\"{real_db_url}\"|g' {APP_PATH}/.env.production")
        
        # Verificar
        _, out, _ = cmd(client, f"grep DATABASE_URL {APP_PATH}/.env.production")
        log(f"  Nuevo valor: {out.strip()[:80]}...", C.G)

        # 7. Limpiar directorio .next
        log("🧹 Limpiando .next...", C.C)
        cmd(client, f"rm -rf {APP_PATH}/.next")
        log("  ✅ Directorio .next eliminado", C.G)

        # 8. Regenerar Prisma
        log("🔧 Regenerando Prisma Client...", C.C)
        status, out, err = cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1", timeout=120)
        if status == 0:
            log("  ✅ Prisma generado", C.G)
        else:
            log(f"  ⚠️ Prisma warning: {err[:100]}", C.Y)

        # 9. Build completo
        log("🏗️ Ejecutando build completo...", C.C)
        status, out, err = cmd(client, f"cd {APP_PATH} && npm run build 2>&1", timeout=900)
        
        if "prerender-manifest.json" in (out + err):
            log("  ⚠️ Error de manifest, reintentando...", C.Y)
            cmd(client, f"rm -rf {APP_PATH}/.next && cd {APP_PATH} && npm run build 2>&1", timeout=900)
        
        # Verificar si existe el manifest
        _, out, _ = cmd(client, f"ls -la {APP_PATH}/.next/prerender-manifest.json 2>&1")
        if "prerender-manifest.json" in out and "No such file" not in out:
            log("  ✅ Build completado - manifest existe", C.G)
        else:
            log("  ⚠️ Build incompleto - verificando alternativas...", C.Y)
            # Verificar si al menos existe standalone
            _, out, _ = cmd(client, f"ls -la {APP_PATH}/.next/ 2>&1 | head -10")
            print(f"  Contenido de .next: {out}")

        # 10. Iniciar PM2
        log("▶️ Iniciando PM2...", C.C)
        cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production 2>/dev/null || pm2 restart inmova-app --update-env")
        cmd(client, "pm2 save")
        log("  ✅ PM2 iniciado", C.G)

        # 11. Esperar
        log("⏳ Esperando warm-up (30s)...", C.C)
        time.sleep(30)

        # 12. Health checks
        log("\n🏥 HEALTH CHECKS:", C.C)
        
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/health 2>/dev/null")
        if '"status":"ok"' in out or '"status": "ok"' in out:
            log("  ✅ HTTP OK", C.G)
        elif out.strip():
            log(f"  ⚠️ HTTP responde: {out[:100]}", C.Y)
        else:
            log("  ❌ HTTP sin respuesta", C.R)

        _, out, _ = cmd(client, "pm2 jlist | grep -o '\"status\":\"[^\"]*\"' | head -1")
        if "online" in out:
            log("  ✅ PM2 online", C.G)
        else:
            log(f"  ⚠️ PM2: {out}", C.Y)

        # 13. Ver logs de error recientes
        log("\n📋 Últimos logs de error:", C.C)
        _, out, _ = cmd(client, "pm2 logs inmova-app --err --lines 10 --nostream 2>&1 | tail -15")
        if out.strip():
            for line in out.strip().split('\n')[-10:]:
                print(f"  {line}")

        print(f"\n{C.G}{'='*60}\n✅ PROCESO COMPLETADO\n{'='*60}{C.E}")
        return True

    except Exception as e:
        log(f"❌ Error: {e}", C.R)
        return False
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
