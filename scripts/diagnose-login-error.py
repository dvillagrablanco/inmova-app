#!/usr/bin/env python3
"""
Diagnosticar y arreglar error de login
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
    print(f"\n{C.C}{'='*60}\n🔍 DIAGNÓSTICO DE ERROR DE LOGIN\n{'='*60}{C.E}\n")

    log("🔐 Conectando al servidor...", C.B)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    log("✅ Conectado", C.G)

    try:
        # 1. Ver logs de error recientes
        log("\n📋 LOGS DE ERROR RECIENTES:", C.C)
        _, out, _ = cmd(client, "pm2 logs inmova-app --err --lines 30 --nostream 2>&1")
        print(out[-2500:])

        # 2. Verificar variables de entorno críticas para auth
        log("\n🔧 VARIABLES DE ENTORNO AUTH:", C.C)
        _, out, _ = cmd(client, f"cd {APP_PATH} && grep -E '^(NEXTAUTH|DATABASE_URL)' .env.production 2>/dev/null | head -10")
        for line in out.strip().split('\n'):
            if 'SECRET' in line:
                # Ocultar el valor del secret
                key = line.split('=')[0]
                print(f"  {key}=*****(configurado)")
            elif 'DATABASE_URL' in line:
                # Mostrar solo parte de la URL
                if 'dummy' in line.lower():
                    print(f"  ❌ DATABASE_URL contiene 'dummy' - PROBLEMA!")
                else:
                    print(f"  ✅ DATABASE_URL configurado")
            else:
                print(f"  {line}")

        # 3. Verificar si NEXTAUTH_SECRET existe
        _, out, _ = cmd(client, f"cd {APP_PATH} && grep -c 'NEXTAUTH_SECRET' .env.production")
        if out.strip() == "0" or not out.strip():
            log("  ❌ NEXTAUTH_SECRET NO ESTÁ CONFIGURADO!", C.R)
        else:
            log("  ✅ NEXTAUTH_SECRET está presente", C.G)

        # 4. Verificar si NEXTAUTH_URL existe
        _, out, _ = cmd(client, f"cd {APP_PATH} && grep 'NEXTAUTH_URL' .env.production")
        if not out.strip():
            log("  ❌ NEXTAUTH_URL NO ESTÁ CONFIGURADO!", C.R)
        else:
            log(f"  {out.strip()}", C.G)

        # 5. Verificar conexión a la BD
        log("\n🗄️ VERIFICANDO BASE DE DATOS:", C.C)
        _, out, _ = cmd(client, "sudo -u postgres psql -c '\\conninfo' 2>/dev/null")
        if out.strip():
            log("  ✅ PostgreSQL está corriendo", C.G)
        
        _, out, _ = cmd(client, "sudo -u postgres psql -d inmova_production -c 'SELECT COUNT(*) FROM \"User\"' 2>/dev/null")
        if "count" in out.lower():
            log(f"  ✅ Tabla User accesible", C.G)
            print(f"  {out.strip()}")
        else:
            log("  ⚠️ No se pudo acceder a la tabla User", C.Y)

        # 6. Test de la API de auth
        log("\n🔐 TEST API AUTH:", C.C)
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/auth/session 2>/dev/null")
        if out.strip():
            log(f"  Session API: {out[:100]}", C.G)
        else:
            log("  ❌ Session API no responde", C.R)

        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/auth/providers 2>/dev/null")
        if out.strip():
            log(f"  Providers API: {out[:100]}", C.G)
        else:
            log("  ❌ Providers API no responde", C.R)

        # 7. Buscar errores específicos de NextAuth
        log("\n🔍 ERRORES NEXTAUTH EN LOGS:", C.C)
        _, out, _ = cmd(client, "pm2 logs inmova-app --lines 100 --nostream 2>&1 | grep -i 'nextauth\\|NO_SECRET\\|auth.*error\\|ECONNREFUSED' | tail -20")
        if out.strip():
            for line in out.strip().split('\n')[-15:]:
                print(f"  {line}")
        else:
            log("  No se encontraron errores específicos de NextAuth", C.Y)

        # 8. Verificar si hay error de BD
        _, out, _ = cmd(client, "pm2 logs inmova-app --lines 100 --nostream 2>&1 | grep -i 'prisma\\|database\\|ECONNREFUSED\\|connection' | tail -10")
        if out.strip():
            log("\n🗄️ ERRORES DE BASE DE DATOS:", C.C)
            for line in out.strip().split('\n')[-10:]:
                print(f"  {line}")

        print(f"\n{C.Y}{'='*60}{C.E}")
        return True

    except Exception as e:
        log(f"❌ Error: {e}", C.R)
        return False
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
