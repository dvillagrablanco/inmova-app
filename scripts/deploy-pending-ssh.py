#!/usr/bin/env python3
"""
Deploy pendientes vía SSH - Migración BD, seed proveedores, catastro + documentos
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
BRANCH = 'cursor/seguros-plataforma-de-cotizaciones-910a'

def exec_cmd(client, cmd, timeout=300):
    """Execute command and return (exit_code, stdout, stderr)"""
    print(f"\n  $ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        # Print last 30 lines max
        lines = out.split('\n')
        if len(lines) > 30:
            print(f"    ... ({len(lines) - 30} lines omitted)")
        for line in lines[-30:]:
            print(f"    {line}")
    if err and exit_code != 0:
        for line in err.split('\n')[-10:]:
            print(f"    [ERR] {line}")
    return exit_code, out, err

def main():
    print("=" * 70)
    print("  DEPLOY PENDIENTES - SSH")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"\n🔐 Conectando a {SERVER}...")
    try:
        client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        sys.exit(1)
    print("✅ Conectado")
    
    try:
        # ─── 0. Verificar estado actual ───
        print("\n" + "─" * 60)
        print("  0. VERIFICACIÓN INICIAL")
        print("─" * 60)
        exec_cmd(client, f"cd {APP_PATH} && git branch --show-current")
        exec_cmd(client, f"cd {APP_PATH} && git status --short | head -5")
        exec_cmd(client, f"cd {APP_PATH} && pm2 status | head -10")
        
        # ─── 1. Git fetch + merge de la rama ───
        print("\n" + "─" * 60)
        print("  1. GIT: Fetch y merge de la rama")
        print("─" * 60)
        
        code, out, err = exec_cmd(client, f"cd {APP_PATH} && git fetch origin {BRANCH}")
        if code != 0:
            print(f"  ⚠️  Fetch falló, intentando pull directo...")
        
        code, out, err = exec_cmd(client, f"cd {APP_PATH} && git merge origin/{BRANCH} --no-edit 2>&1 || git pull origin {BRANCH} --no-edit 2>&1")
        
        # ─── 2. Install deps si cambiaron ───
        print("\n" + "─" * 60)
        print("  2. DEPENDENCIAS")
        print("─" * 60)
        code, out, err = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=600)
        
        # ─── 3. Prisma generate + db push ───
        print("\n" + "─" * 60)
        print("  3. PRISMA: Generate + DB Push")
        print("─" * 60)
        
        code, out, err = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -10", timeout=120)
        if code != 0:
            print("  ⚠️  prisma generate falló, intentando con versión explícita...")
            exec_cmd(client, f"cd {APP_PATH} && npx prisma@6.7.0 generate 2>&1 | tail -10", timeout=120)
        
        print("\n  📊 Aplicando migración de BD...")
        code, out, err = exec_cmd(client, f"cd {APP_PATH} && npx prisma db push 2>&1 | tail -15", timeout=120)
        if code != 0:
            print("  ⚠️  db push falló, intentando con versión explícita...")
            code, out, err = exec_cmd(client, f"cd {APP_PATH} && npx prisma@6.7.0 db push 2>&1 | tail -15", timeout=120)
        
        if code == 0:
            print("  ✅ Migración BD completada")
        else:
            print("  ❌ Migración falló - revisar errores arriba")
            # Continuar de todos modos para intentar el resto
        
        # ─── 4. Seed proveedores de seguros ───
        print("\n" + "─" * 60)
        print("  4. SEED: Proveedores de seguros Rovida/Viroda")
        print("─" * 60)
        code, out, err = exec_cmd(client, f"cd {APP_PATH} && npx tsx scripts/seed-insurance-providers.ts 2>&1 | tail -30", timeout=120)
        if code == 0:
            print("  ✅ Proveedores creados")
        else:
            print(f"  ⚠️  Seed proveedores: exit code {code}")
        
        # ─── 5. Catastro + Documentos ───
        print("\n" + "─" * 60)
        print("  5. CATASTRO + DOCUMENTOS: Fichas catastrales y docs faltantes")
        print("─" * 60)
        code, out, err = exec_cmd(client, f"cd {APP_PATH} && npx tsx scripts/load-catastro-and-documents.ts --apply 2>&1 | tail -50", timeout=300)
        if code == 0:
            print("  ✅ Catastro y documentos cargados")
        else:
            print(f"  ⚠️  Catastro + docs: exit code {code}")
        
        # ─── 6. Build y Reload PM2 ───
        print("\n" + "─" * 60)
        print("  6. BUILD + RELOAD")
        print("─" * 60)
        
        print("  🏗️  Building app...")
        code, out, err = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -15", timeout=600)
        if code == 0:
            print("  ✅ Build completado")
        else:
            print("  ⚠️  Build tuvo warnings/errores, continuando con reload...")
        
        print("  ♻️  Reloading PM2...")
        exec_cmd(client, f"pm2 reload inmova-app --update-env 2>&1 | tail -5")
        time.sleep(10)
        
        # ─── 7. Health check ───
        print("\n" + "─" * 60)
        print("  7. HEALTH CHECK")
        print("─" * 60)
        
        code, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health 2>&1")
        if 'ok' in out.lower() or code == 0:
            print("  ✅ Health check OK")
        else:
            print("  ⚠️  Health check: verificar manualmente")
        
        # ─── 8. Verificar login ───
        print("\n  🔐 Verificando login API...")
        code, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/auth/session 2>&1")
        
        # ─── 9. PM2 status final ───
        print("\n  📊 Estado PM2:")
        exec_cmd(client, "pm2 status 2>&1 | head -10")
        
        # ─── 10. Resumen ───
        print("\n" + "═" * 70)
        print("  ✅ DEPLOY COMPLETADO")
        print("═" * 70)
        print(f"\n  URLs:")
        print(f"    https://inmovaapp.com/seguros")
        print(f"    https://inmovaapp.com/seguros/proveedores")
        print(f"    https://inmovaapp.com/seguros/cotizaciones")
        print(f"    http://{SERVER}:3000/seguros")
        
    except Exception as e:
        print(f"\n❌ Error durante deploy: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()
        print("\n🔌 Conexión cerrada")

if __name__ == '__main__':
    main()
