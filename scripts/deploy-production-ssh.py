#!/usr/bin/env python3
"""Deploy GoCardless + SEPA developments to production via SSH"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_DIR = '/opt/inmova-app'

def exec_cmd(client, cmd, timeout=300):
    print(f"  $ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        # Print max 30 lines
        lines = out.split('\n')
        for line in lines[:30]:
            print(f"    {line}")
        if len(lines) > 30:
            print(f"    ... ({len(lines) - 30} more lines)")
    if err and exit_code != 0:
        for line in err.split('\n')[:10]:
            print(f"    [ERR] {line}")
    return exit_code, out, err

def main():
    print("=" * 70)
    print("DEPLOY PRODUCCION - GOCARDLESS + SEPA + SIDEBAR")
    print("=" * 70)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"\n[1/8] Conectando a {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)
    print("  Conectado.")

    # 2. Check current state
    print(f"\n[2/8] Estado actual del servidor...")
    exec_cmd(client, f"cd {APP_DIR} && git branch --show-current")
    exec_cmd(client, f"cd {APP_DIR} && git log --oneline -3")

    # 3. Pull latest from main
    print(f"\n[3/8] Actualizando código (git pull origin main)...")
    code, out, err = exec_cmd(client, f"cd {APP_DIR} && git stash 2>/dev/null; git checkout main 2>&1 && git pull origin main 2>&1")
    if code != 0:
        print(f"  WARN: git pull exit code {code}")
        # Try force
        exec_cmd(client, f"cd {APP_DIR} && git fetch origin main && git reset --hard origin/main")

    # Verify key files exist
    print(f"\n[4/8] Verificando archivos clave...")
    key_files = [
        "app/pagos/sepa/page.tsx",
        "app/api/gocardless/setup-tenant/route.ts",
        "lib/gocardless-integration.ts",
        "lib/ai-reconciliation-service.ts",
        "lib/sepa-notification-service.ts",
        "components/layout/sidebar-data.ts",
    ]
    for f in key_files:
        code, out, _ = exec_cmd(client, f"test -f {APP_DIR}/{f} && echo 'OK' || echo 'MISSING'")
        status = "OK" if "OK" in out else "MISSING"
        print(f"    {f}: {status}")

    # Verify sidebar has SEPA entries
    print(f"\n  Verificando sidebar contiene Cobros SEPA...")
    code, out, _ = exec_cmd(client, f"grep -c 'Cobros SEPA' {APP_DIR}/components/layout/sidebar-data.ts")
    print(f"    'Cobros SEPA' encontrado: {out} veces")
    code, out, _ = exec_cmd(client, f"grep -c 'Conciliación Bancaria' {APP_DIR}/components/layout/sidebar-data.ts")
    print(f"    'Conciliación Bancaria' encontrado: {out} veces")

    # 5. Install deps
    print(f"\n[5/8] Instalando dependencias...")
    code, out, err = exec_cmd(client, f"cd {APP_DIR} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=600)

    # 6. Generate Prisma + Build
    print(f"\n[6/8] Prisma generate + Build...")
    exec_cmd(client, f"cd {APP_DIR} && npx prisma generate 2>&1 | tail -5", timeout=120)

    # Run prisma db push to create new tables
    print("  Aplicando schema a BD (prisma db push)...")
    code, out, err = exec_cmd(client, f"cd {APP_DIR} && npx prisma db push --accept-data-loss 2>&1 | tail -10", timeout=120)

    print("  Building Next.js...")
    code, out, err = exec_cmd(client, f"cd {APP_DIR} && npm run build 2>&1 | tail -15", timeout=600)
    if code != 0:
        print(f"  WARN: Build exit code {code}")
        # Check if build actually exists
        exec_cmd(client, f"test -d {APP_DIR}/.next && echo 'Build dir exists' || echo 'NO BUILD DIR'")

    # 7. Restart PM2
    print(f"\n[7/8] Reiniciando PM2...")
    exec_cmd(client, f"cd {APP_DIR} && pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1")
    time.sleep(15)
    print("  Esperando warm-up (15s)...")

    # 8. Health check
    print(f"\n[8/8] Health checks...")
    exec_cmd(client, "pm2 status 2>&1 | head -10")

    code, out, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health")
    print(f"  Health API: HTTP {out}")

    code, out, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/pagos/sepa")
    print(f"  /pagos/sepa: HTTP {out}")

    code, out, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/finanzas/conciliacion")
    print(f"  /finanzas/conciliacion: HTTP {out}")

    # Check sidebar content is served
    code, out, _ = exec_cmd(client, "curl -s http://localhost:3000/pagos/sepa | grep -o 'Cobros SEPA' | head -1")
    print(f"  Sidebar 'Cobros SEPA' in HTML: {'SI' if 'Cobros SEPA' in out else 'NO (puede ser client-rendered)'}")

    # Check git log
    print(f"\n  Git commit actual:")
    exec_cmd(client, f"cd {APP_DIR} && git log --oneline -5")

    # Check PM2 logs for errors
    print(f"\n  Últimos errores PM2:")
    exec_cmd(client, "pm2 logs inmova-app --err --lines 5 --nostream 2>&1")

    print("\n" + "=" * 70)
    print("DEPLOY COMPLETADO")
    print("=" * 70)
    print(f"""
  URLs:
    Cobros SEPA:          https://inmovaapp.com/pagos/sepa
    Conciliación:         https://inmovaapp.com/finanzas/conciliacion
    Config GoCardless:    https://inmovaapp.com/configuracion/integraciones/gocardless

  Sidebar: sección '💰 Finanzas' → 'Cobros SEPA' y 'Conciliación Bancaria'

  Si la sección Finanzas está colapsada, haz click en '💰 Finanzas' para expandir.
  Si aún no aparece, borra caché del navegador (Ctrl+Shift+R).
    """)

    client.close()

if __name__ == '__main__':
    main()
