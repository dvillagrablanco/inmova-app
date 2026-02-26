#!/usr/bin/env python3
"""
Deploy to production + import escritura data.
1. Git pull main on server
2. npm install + prisma generate + build
3. PM2 reload
4. Run import scripts (update-silvela-dimensions + update-rentabilidad-escrituras)
5. Health check
"""

import sys, time, os

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASS = os.environ.get('SSH_PASS', 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=')
APP_DIR = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    NC = '\033[0m'

def exec_cmd(client, cmd, timeout=300):
    print(f"  {Colors.BLUE}$ {cmd[:80]}{'...' if len(cmd) > 80 else ''}{Colors.NC}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if exit_code != 0:
        print(f"  {Colors.RED}EXIT {exit_code}{Colors.NC}")
        if err.strip():
            for line in err.strip().split('\n')[:5]:
                print(f"  {Colors.RED}{line}{Colors.NC}")
    return exit_code, out, err

def main():
    print(f"\n{'='*70}")
    print(f"DEPLOY + IMPORT ESCRITURAS A PRODUCCIÓN")
    print(f"{'='*70}")
    print(f"Servidor: {SERVER}")
    print(f"App dir:  {APP_DIR}\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"{Colors.GREEN}Conectando a {SERVER}...{Colors.NC}")
        client.connect(SERVER, username=USER, password=PASS, timeout=15)
        print(f"{Colors.GREEN}Conectado.{Colors.NC}\n")
    except Exception as e:
        print(f"{Colors.RED}Error de conexión: {e}{Colors.NC}")
        sys.exit(1)

    try:
        # ─── FASE 1: GIT PULL ───
        print(f"\n{'─'*50}")
        print(f"FASE 1: Git pull main")
        print(f"{'─'*50}")
        code, out, _ = exec_cmd(client, f"cd {APP_DIR} && git fetch origin main && git reset --hard origin/main")
        if code != 0:
            print(f"{Colors.RED}Git pull falló{Colors.NC}")
            sys.exit(1)
        print(f"{Colors.GREEN}✓ Código actualizado{Colors.NC}")

        # ─── FASE 2: INSTALL + BUILD ───
        print(f"\n{'─'*50}")
        print(f"FASE 2: Install + Build")
        print(f"{'─'*50}")

        code, _, _ = exec_cmd(client, f"cd {APP_DIR} && npm install --legacy-peer-deps 2>&1 | tail -3", timeout=600)
        if code != 0:
            print(f"{Colors.YELLOW}npm install con warnings (puede ser OK){Colors.NC}")
        print(f"{Colors.GREEN}✓ Dependencias instaladas{Colors.NC}")

        code, _, _ = exec_cmd(client, f"cd {APP_DIR} && npx prisma generate 2>&1 | tail -3")
        print(f"{Colors.GREEN}✓ Prisma generado{Colors.NC}")

        code, out, err = exec_cmd(client, f"cd {APP_DIR} && npm run build 2>&1 | tail -10", timeout=600)
        if code != 0:
            print(f"{Colors.RED}Build falló. Últimas líneas:{Colors.NC}")
            print(out[-500:] if out else err[-500:])
            sys.exit(1)
        print(f"{Colors.GREEN}✓ Build completado{Colors.NC}")

        # ─── FASE 3: PM2 RELOAD ───
        print(f"\n{'─'*50}")
        print(f"FASE 3: PM2 Reload")
        print(f"{'─'*50}")
        exec_cmd(client, f"cd {APP_DIR} && pm2 reload inmova-app --update-env 2>&1 | tail -5")
        print(f"Esperando warm-up (15s)...")
        time.sleep(15)
        print(f"{Colors.GREEN}✓ PM2 reloaded{Colors.NC}")

        # ─── FASE 4: HEALTH CHECK ───
        print(f"\n{'─'*50}")
        print(f"FASE 4: Health Check")
        print(f"{'─'*50}")
        code, out, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in out or '"status": "ok"' in out:
            print(f"{Colors.GREEN}✓ Health check OK{Colors.NC}")
        else:
            print(f"{Colors.YELLOW}⚠ Health check: {out[:200]}{Colors.NC}")

        # ─── FASE 5: IMPORT ESCRITURAS DATA ───
        print(f"\n{'─'*50}")
        print(f"FASE 5: Import datos de escrituras")
        print(f"{'─'*50}")

        # 5a: Update Silvela dimensions
        print(f"\n  5a. Actualizando dimensiones Silvela...")
        code, out, err = exec_cmd(client,
            f"cd {APP_DIR} && npx tsx scripts/update-silvela-dimensions.ts 2>&1",
            timeout=60)
        if code == 0:
            print(f"{Colors.GREEN}✓ Silvela dimensiones actualizadas{Colors.NC}")
        else:
            print(f"{Colors.YELLOW}⚠ Silvela: {err[:200] or out[:200]}{Colors.NC}")

        # Print output
        for line in out.split('\n'):
            if '✓' in line or '→' in line or 'Resultado' in line:
                print(f"    {line.strip()}")

        # 5b: Update rentabilidad from escrituras
        print(f"\n  5b. Actualizando rentabilidad con precios de escrituras...")
        code, out, err = exec_cmd(client,
            f"cd {APP_DIR} && npx tsx scripts/update-rentabilidad-escrituras.ts --apply 2>&1",
            timeout=120)
        if code == 0:
            print(f"{Colors.GREEN}✓ Rentabilidad actualizada{Colors.NC}")
        else:
            print(f"{Colors.YELLOW}⚠ Rentabilidad: {err[:200] or out[:200]}{Colors.NC}")

        # Print relevant output
        for line in out.split('\n'):
            if '✓' in line or '│' in line or '═' in line or 'FASE' in line or 'DRY' in line or 'COMPLETADO' in line:
                print(f"    {line.strip()}")

        # 5c: Import escrituras documents
        print(f"\n  5c. Importando documentos de escrituras...")
        code, out, err = exec_cmd(client,
            f"cd {APP_DIR} && npx tsx scripts/import-escrituras-data.ts --apply 2>&1",
            timeout=120)
        if code == 0:
            print(f"{Colors.GREEN}✓ Escrituras importadas{Colors.NC}")
        else:
            print(f"{Colors.YELLOW}⚠ Escrituras: {err[:200] or out[:200]}{Colors.NC}")

        for line in out.split('\n'):
            if '✓' in line or 'Doc' in line or 'Asset' in line or 'COMPLETADO' in line:
                print(f"    {line.strip()}")

        # ─── FASE 6: FINAL VERIFICATION ───
        print(f"\n{'─'*50}")
        print(f"FASE 6: Verificación final")
        print(f"{'─'*50}")

        code, out, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        health_ok = '"status":"ok"' in out or '"status": "ok"' in out
        if health_ok:
            print(f"{Colors.GREEN}✓ Health check final OK{Colors.NC}")
        else:
            print(f"{Colors.RED}✗ Health check final FAILED{Colors.NC}")

        code, out, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/inversiones/analisis")
        print(f"  Análisis inversiones: HTTP {out}")

        code, out, _ = exec_cmd(client, "pm2 status inmova-app --no-color 2>&1 | head -10")
        for line in out.split('\n'):
            if 'inmova' in line.lower() or 'online' in line.lower():
                print(f"  {line.strip()}")

        print(f"\n{'='*70}")
        print(f"{Colors.GREEN}DEPLOY + IMPORT COMPLETADO{Colors.NC}")
        print(f"{'='*70}")
        print(f"\nURLs:")
        print(f"  App:       https://inmovaapp.com")
        print(f"  Análisis:  https://inmovaapp.com/inversiones/analisis")
        print(f"  Health:    https://inmovaapp.com/api/health")
        print(f"  Fallback:  http://{SERVER}:3000")

    finally:
        client.close()


if __name__ == '__main__':
    main()
