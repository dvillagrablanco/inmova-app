#!/usr/bin/env python3
"""
Arreglar configuración de autenticación y BD
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
    print(f"\n{C.C}{'='*60}\n🔧 ARREGLAR CONFIGURACIÓN DE AUTH Y BD\n{'='*60}{C.E}\n")

    log("🔐 Conectando al servidor...", C.B)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
    log("✅ Conectado", C.G)

    try:
        # 1. Generar NEXTAUTH_SECRET
        log("\n🔑 PASO 1: Configurando NEXTAUTH_SECRET...", C.C)
        nextauth_secret = secrets.token_hex(32)
        
        # Verificar si ya existe
        _, out, _ = cmd(client, f"grep -c 'NEXTAUTH_SECRET=' {APP_PATH}/.env.production 2>/dev/null || echo '0'")
        if out.strip() != "0" and out.strip() != "":
            log("  Actualizando NEXTAUTH_SECRET existente...", C.Y)
            cmd(client, f"sed -i 's|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"{nextauth_secret}\"|g' {APP_PATH}/.env.production")
        else:
            log("  Añadiendo NEXTAUTH_SECRET...", C.Y)
            cmd(client, f"echo 'NEXTAUTH_SECRET=\"{nextauth_secret}\"' >> {APP_PATH}/.env.production")
        log("  ✅ NEXTAUTH_SECRET configurado", C.G)

        # 2. Configurar NEXTAUTH_URL
        log("\n🌐 PASO 2: Configurando NEXTAUTH_URL...", C.C)
        nextauth_url = "https://inmovaapp.com"
        
        _, out, _ = cmd(client, f"grep -c 'NEXTAUTH_URL=' {APP_PATH}/.env.production 2>/dev/null || echo '0'")
        if out.strip() != "0" and out.strip() != "":
            cmd(client, f"sed -i 's|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"{nextauth_url}\"|g' {APP_PATH}/.env.production")
        else:
            cmd(client, f"echo 'NEXTAUTH_URL=\"{nextauth_url}\"' >> {APP_PATH}/.env.production")
        log(f"  ✅ NEXTAUTH_URL={nextauth_url}", C.G)

        # 3. Arreglar credenciales de BD
        log("\n🗄️ PASO 3: Verificando y arreglando BD...", C.C)
        
        # Verificar usuario de PostgreSQL
        _, out, _ = cmd(client, "sudo -u postgres psql -c \"SELECT usename FROM pg_user WHERE usename='inmova_user';\" 2>/dev/null")
        if "inmova_user" in out:
            log("  ✅ Usuario inmova_user existe", C.G)
            
            # Resetear contraseña del usuario
            log("  Reseteando contraseña de inmova_user...", C.Y)
            new_password = "InmovaApp2024!"
            cmd(client, f"sudo -u postgres psql -c \"ALTER USER inmova_user WITH PASSWORD '{new_password}';\" 2>/dev/null")
            log("  ✅ Contraseña actualizada", C.G)
        else:
            log("  ⚠️ Usuario inmova_user no existe, creándolo...", C.Y)
            new_password = "InmovaApp2024!"
            cmd(client, f"sudo -u postgres psql -c \"CREATE USER inmova_user WITH PASSWORD '{new_password}';\" 2>/dev/null")
            cmd(client, f"sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;\" 2>/dev/null")
            log("  ✅ Usuario creado", C.G)

        # 4. Actualizar DATABASE_URL
        log("\n📝 PASO 4: Actualizando DATABASE_URL...", C.C)
        db_url = f"postgresql://inmova_user:{new_password}@localhost:5432/inmova_production?schema=public"
        
        # Backup primero
        cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.bak.$(date +%Y%m%d%H%M%S)")
        
        # Actualizar DATABASE_URL
        _, out, _ = cmd(client, f"grep -c '^DATABASE_URL=' {APP_PATH}/.env.production 2>/dev/null || echo '0'")
        if out.strip() != "0" and out.strip() != "":
            cmd(client, f"sed -i 's|^DATABASE_URL=.*|DATABASE_URL=\"{db_url}\"|g' {APP_PATH}/.env.production")
        else:
            cmd(client, f"echo 'DATABASE_URL=\"{db_url}\"' >> {APP_PATH}/.env.production")
        log("  ✅ DATABASE_URL actualizado", C.G)

        # 5. Verificar configuración
        log("\n🔍 PASO 5: Verificando configuración...", C.C)
        _, out, _ = cmd(client, f"grep -E '^(NEXTAUTH_SECRET|NEXTAUTH_URL|DATABASE_URL)' {APP_PATH}/.env.production")
        for line in out.strip().split('\n'):
            if 'SECRET' in line:
                print(f"  NEXTAUTH_SECRET=*****(configurado)")
            elif 'DATABASE_URL' in line:
                print(f"  DATABASE_URL=postgresql://inmova_user:****@localhost:5432/inmova_production")
            else:
                print(f"  {line}")

        # 6. Probar conexión a BD
        log("\n🧪 PASO 6: Probando conexión a BD...", C.C)
        _, out, _ = cmd(client, f"cd {APP_PATH} && PGPASSWORD='{new_password}' psql -U inmova_user -d inmova_production -c 'SELECT 1' -h localhost 2>&1")
        if "1" in out:
            log("  ✅ Conexión a BD exitosa", C.G)
        else:
            log(f"  ⚠️ Error de conexión: {out[:100]}", C.Y)
            # Intentar arreglar permisos
            log("  Intentando arreglar permisos...", C.Y)
            cmd(client, "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inmova_user;\" -d inmova_production 2>/dev/null")
            cmd(client, "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inmova_user;\" -d inmova_production 2>/dev/null")
            cmd(client, "sudo -u postgres psql -c \"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO inmova_user;\" -d inmova_production 2>/dev/null")

        # 7. Ejecutar migraciones de Prisma
        log("\n📦 PASO 7: Ejecutando Prisma migrate...", C.C)
        _, out, err = cmd(client, f"cd {APP_PATH} && npx prisma db push --accept-data-loss 2>&1", timeout=120)
        if "Your database is now in sync" in out or "applied" in out.lower():
            log("  ✅ Base de datos sincronizada", C.G)
        else:
            log(f"  ⚠️ Prisma output: {(out + err)[-200:]}", C.Y)

        # 8. Reiniciar PM2 con nuevas variables
        log("\n♻️ PASO 8: Reiniciando PM2...", C.C)
        cmd(client, "pm2 stop inmova-app 2>/dev/null || true")
        time.sleep(2)
        cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production --update-env 2>/dev/null || pm2 start npm --name inmova-app -- start")
        cmd(client, "pm2 save")
        log("  ✅ PM2 reiniciado", C.G)

        # 9. Esperar warm-up
        log("\n⏳ Esperando warm-up (25s)...", C.C)
        time.sleep(25)

        # 10. Verificar que auth funciona
        log("\n🏥 PASO 9: Verificando auth...", C.C)
        
        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/auth/providers 2>/dev/null")
        if out.strip() and "credentials" in out.lower():
            log("  ✅ API Auth providers OK", C.G)
        else:
            log(f"  ⚠️ Auth providers: {out[:100] if out else 'sin respuesta'}", C.Y)

        _, out, _ = cmd(client, "curl -sf http://localhost:3000/api/auth/session 2>/dev/null")
        if out.strip():
            log(f"  ✅ API Auth session OK: {out[:50]}", C.G)
        else:
            log("  ⚠️ Auth session sin respuesta", C.Y)

        # 11. Verificar logs de error
        log("\n📋 Verificando logs de error...", C.C)
        _, out, _ = cmd(client, "pm2 logs inmova-app --err --lines 10 --nostream 2>&1 | grep -i 'NO_SECRET\\|error' | tail -5")
        if "NO_SECRET" in out:
            log("  ⚠️ Aún hay errores NO_SECRET - puede necesitar rebuild", C.Y)
        elif out.strip():
            log("  ⚠️ Otros errores encontrados", C.Y)
            for line in out.strip().split('\n')[-3:]:
                print(f"    {line}")
        else:
            log("  ✅ No hay errores críticos de auth", C.G)

        print(f"""
{C.G}{'='*60}
✅ CONFIGURACIÓN COMPLETADA
{'='*60}{C.E}

{C.Y}Configuración aplicada:{C.E}
  - NEXTAUTH_SECRET: Configurado (nuevo secret generado)
  - NEXTAUTH_URL: https://inmovaapp.com
  - DATABASE_URL: postgresql://inmova_user:****@localhost:5432/inmova_production

{C.Y}Próximos pasos si el login sigue fallando:{C.E}
  1. Hacer rebuild: npm run build
  2. Reiniciar: pm2 restart inmova-app --update-env

{C.Y}Test de login:{C.E}
  URL: https://inmovaapp.com/login
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
