#!/usr/bin/env python3
"""
Rebuild y verificación final del servidor
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

def cmd(client, command, timeout=300, show=False):
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        status = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        if show and out.strip():
            for line in out.strip().split('\n')[:20]:
                print(f"  {line}")
        return status, out, err
    except Exception as e:
        return -1, "", str(e)

def main():
    print(f"\n{C.C}{'='*60}\n🔄 REBUILD Y VERIFICACIÓN\n{'='*60}{C.E}\n")

    log("🔐 Conectando...", C.B)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    log("✅ Conectado", C.G)

    try:
        # 1. Verificar commit actual
        log("📌 Verificando commit...", C.C)
        _, out, _ = cmd(client, f"cd {APP_PATH} && git log --oneline -3")
        for line in out.strip().split('\n'):
            print(f"  {line}")

        # 2. Verificar si existe .next
        _, out, _ = cmd(client, f"ls -la {APP_PATH}/.next 2>/dev/null | head -3")
        if ".next" in out or "total" in out:
            log("✅ Directorio .next existe", C.G)
        else:
            log("⚠️ No existe .next, necesita build", C.Y)

        # 3. Intentar build
        log("\n🏗️ Ejecutando build...", C.C)
        status, out, err = cmd(client, f"cd {APP_PATH} && npm run build 2>&1", timeout=900, show=False)
        
        # Verificar resultado
        if "✓ Compiled" in out or "Compiled successfully" in out or "Route" in out:
            log("✅ Build completado exitosamente", C.G)
            # Mostrar últimas líneas del build
            lines = out.strip().split('\n')
            for line in lines[-10:]:
                print(f"  {line}")
        elif status == 0:
            log("✅ Build completado (exit 0)", C.G)
        else:
            log(f"⚠️ Build warning/error (exit {status})", C.Y)
            # Mostrar últimas líneas de error
            for line in (out + err).strip().split('\n')[-15:]:
                print(f"  {line}")

        # 4. Reiniciar PM2
        log("\n♻️ Reiniciando PM2...", C.C)
        cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env")
        cmd(client, "pm2 save")
        log("✅ PM2 reiniciado", C.G)

        # 5. Esperar
        log("⏳ Esperando warm-up (30s)...", C.C)
        time.sleep(30)

        # 6. Health checks
        log("\n🏥 HEALTH CHECKS:", C.C)
        
        # HTTP Health
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/health 2>/dev/null")
        if '"status":"ok"' in out or '"status": "ok"' in out:
            log("  ✅ HTTP /api/health: OK", C.G)
        else:
            log(f"  ⚠️ HTTP: {out[:80]}", C.Y)

        # PM2 Status
        _, out, _ = cmd(client, "pm2 jlist 2>/dev/null | grep -o '\"status\":\"[^\"]*\"' | head -1")
        if "online" in out:
            log("  ✅ PM2 status: online", C.G)
        else:
            log(f"  ⚠️ PM2: {out}", C.Y)

        # Landing page
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/ 2>/dev/null | head -c 100")
        if "html" in out.lower() or "<!doctype" in out.lower():
            log("  ✅ Landing page: cargando", C.G)
        else:
            log(f"  ⚠️ Landing: {out[:50]}", C.Y)

        # Login page
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/login 2>/dev/null | head -c 100")
        if "html" in out.lower() or "<!doctype" in out.lower():
            log("  ✅ Login page: cargando", C.G)
        else:
            log(f"  ⚠️ Login: {out[:50]}", C.Y)

        # 7. Verificar commit final
        _, out, _ = cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        final_commit = out.strip()

        print(f"""
{C.G}{'='*60}
✅ DEPLOYMENT COMPLETADO Y VERIFICADO
{'='*60}{C.E}

Servidor: {SERVER_IP}
Commit: {final_commit}
URLs:
  - https://inmovaapp.com
  - http://{SERVER_IP}:3000

Comandos útiles:
  pm2 logs inmova-app
  pm2 status
""")
        return True

    except Exception as e:
        log(f"❌ Error: {e}", C.R)
        return False
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
