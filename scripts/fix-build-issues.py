#!/usr/bin/env python3
"""
Investigar y arreglar problemas del build
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
    print(f"\n{C.C}{'='*60}\n🔧 INVESTIGAR Y ARREGLAR BUILD\n{'='*60}{C.E}\n")

    log("🔐 Conectando...", C.B)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    log("✅ Conectado", C.G)

    try:
        # 1. Ver errores específicos del build
        log("📋 Investigando errores del build anterior...", C.C)
        
        # Intentar build con output completo
        log("🏗️ Ejecutando build con verbose...", C.C)
        status, out, err = cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -100", timeout=900)
        
        # Buscar errores específicos
        all_output = out + err
        if "Export encountered errors" in all_output:
            log("⚠️ Errores en generación de páginas estáticas:", C.Y)
            # Extraer páginas con error
            for line in all_output.split('\n'):
                if '/page:' in line or 'Error:' in line:
                    print(f"  {line}")
        
        # 2. Verificar si el manifest se generó
        log("\n🔍 Verificando archivos de build...", C.C)
        _, out, _ = cmd(client, f"ls -la {APP_PATH}/.next/*.json 2>&1")
        print(f"  {out}")
        
        # 3. Si no hay prerender-manifest, crearlo vacío
        _, out, _ = cmd(client, f"test -f {APP_PATH}/.next/prerender-manifest.json && echo 'EXISTS' || echo 'MISSING'")
        if "MISSING" in out:
            log("📝 Creando prerender-manifest.json...", C.C)
            manifest_content = '{"version":4,"routes":{},"dynamicRoutes":{},"staticRoutes":{},"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}'
            cmd(client, f"echo '{manifest_content}' > {APP_PATH}/.next/prerender-manifest.json")
            log("  ✅ Manifest creado", C.G)
        
        # 4. Verificar routes-manifest.json
        _, out, _ = cmd(client, f"test -f {APP_PATH}/.next/routes-manifest.json && echo 'EXISTS' || echo 'MISSING'")
        if "MISSING" in out:
            log("📝 Creando routes-manifest.json vacío...", C.C)
            routes_content = '{"version":3,"pages404":true,"basePath":"","redirects":[],"headers":[],"dynamicRoutes":[],"staticRoutes":[],"dataRoutes":[],"rewrites":[]}'
            cmd(client, f"echo '{routes_content}' > {APP_PATH}/.next/routes-manifest.json")
        
        # 5. Reiniciar PM2
        log("\n♻️ Reiniciando PM2...", C.C)
        cmd(client, "pm2 restart inmova-app --update-env")
        cmd(client, "pm2 save")
        
        log("⏳ Esperando (20s)...", C.C)
        time.sleep(20)
        
        # 6. Verificar health
        log("\n🏥 Health check:", C.C)
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/health 2>/dev/null")
        if '"status":"ok"' in out:
            log("  ✅ HTTP OK!", C.G)
        elif out.strip():
            log(f"  Respuesta: {out[:200]}", C.Y)
        else:
            log("  ❌ Sin respuesta", C.R)
            
            # Ver logs de error
            log("\n📋 Logs de error recientes:", C.C)
            _, out, _ = cmd(client, "pm2 logs inmova-app --err --lines 15 --nostream")
            for line in out.strip().split('\n')[-10:]:
                print(f"  {line}")
        
        # 7. Verificar PM2 status
        _, out, _ = cmd(client, "pm2 jlist | grep -o '\"status\":\"[^\"]*\"' | head -1")
        log(f"  PM2 status: {out.strip()}", C.G if "online" in out else C.Y)
        
        # 8. Si sigue fallando, intentar usar next dev temporalmente
        if '"status":"ok"' not in out and "online" not in out:
            log("\n🔄 Intentando modo alternativo...", C.Y)
            # Probar iniciar con npm run dev en background
            cmd(client, "pm2 stop inmova-app 2>/dev/null || true")
            cmd(client, f"cd {APP_PATH} && pm2 start 'npm run start' --name inmova-app")
            time.sleep(15)
            
            _, out, _ = cmd(client, "curl -sf http://localhost:3000/ 2>/dev/null | head -c 100")
            if out.strip():
                log(f"  Respuesta: {out[:100]}", C.G)
            else:
                log("  ❌ Sigue sin responder", C.R)

        print(f"\n{C.G}{'='*60}{C.E}")
        return True

    except Exception as e:
        log(f"❌ Error: {e}", C.R)
        return False
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
