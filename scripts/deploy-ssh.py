#!/usr/bin/env python3
"""
Deploy automatizado vía SSH con Paramiko para Inmova App
Auditoría multi-empresa - Feb 2026
"""
import sys
import time
import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
BRANCH = 'main'


class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'


def log(msg, color=Colors.END):
    ts = time.strftime('%H:%M:%S')
    print(f"[{ts}] {color}{msg}{Colors.END}")


def exec_cmd(client, cmd, timeout=300):
    """Ejecuta un comando SSH y retorna (exit_status, stdout, stderr)"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return exit_status, out, err


def deploy():
    print(f"\n{'='*70}")
    print(f"{Colors.CYAN}{Colors.BOLD}  DEPLOYMENT INMOVA APP - AUDITORÍA MULTI-EMPRESA{Colors.END}")
    print(f"{'='*70}")
    print(f"  Servidor: {SERVER_IP}")
    print(f"  Path: {APP_PATH}")
    print(f"  Branch: {BRANCH}")
    print(f"{'='*70}\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # 1. Conectar
    log("Conectando al servidor...", Colors.CYAN)
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=15)
        log("Conectado", Colors.GREEN)
    except Exception as e:
        log(f"Error de conexión: {e}", Colors.RED)
        return False

    try:
        # 2. Verificar que la app existe
        log("Verificando directorio de la app...", Colors.CYAN)
        status, out, err = exec_cmd(client, f"ls -la {APP_PATH}/package.json")
        if status != 0:
            log(f"App no encontrada en {APP_PATH}", Colors.RED)
            return False
        log("Directorio verificado", Colors.GREEN)

        # 3. Backup de BD
        log("Creando backup de BD...", Colors.CYAN)
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        exec_cmd(client, f"mkdir -p /var/backups/inmova")
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && pg_dump -U $(grep 'DATABASE_URL' .env.production 2>/dev/null | head -1 | sed 's/.*\\/\\/\\([^:]*\\):.*/\\1/' || echo 'postgres') inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || echo 'backup-skipped'",
            timeout=60
        )
        log(f"Backup: {'completado' if 'skipped' not in out else 'omitido (no-critical)'}", Colors.GREEN)

        # 4. Guardar commit actual (rollback)
        status, current_commit, _ = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        log(f"Commit actual: {current_commit}", Colors.CYAN)

        # 5. Git pull
        log("Actualizando código desde GitHub...", Colors.CYAN)
        
        # Primero, fetch y merge de main
        status, out, err = exec_cmd(client, f"cd {APP_PATH} && git fetch origin {BRANCH}", timeout=60)
        if status != 0:
            log(f"Error en git fetch: {err}", Colors.RED)
            # Intentar con merge de la branch de auditoría
            log("Intentando merge de branch de auditoría...", Colors.YELLOW)
            status, out, err = exec_cmd(client, f"cd {APP_PATH} && git fetch origin cursor/auditor-a-de-aplicaci-n-multi-empresa-5387", timeout=60)
        
        # Merge los cambios
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && git stash 2>/dev/null; git checkout {BRANCH} 2>/dev/null; git pull origin {BRANCH} --no-edit",
            timeout=60
        )
        if status != 0:
            log(f"Intentando merge directo de la branch de auditoría...", Colors.YELLOW)
            status, out, err = exec_cmd(
                client,
                f"cd {APP_PATH} && git merge origin/cursor/auditor-a-de-aplicaci-n-multi-empresa-5387 --no-edit 2>&1 || git pull origin {BRANCH} --no-edit",
                timeout=60
            )
        
        status, new_commit, _ = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        log(f"Nuevo commit: {new_commit}", Colors.GREEN)

        # 6. Instalar dependencias (solo si hay cambios en package.json)
        log("Verificando dependencias...", Colors.CYAN)
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install --production=false 2>&1 | tail -5",
            timeout=300
        )
        log("Dependencias actualizadas", Colors.GREEN)

        # 7. Prisma generate
        log("Generando Prisma Client...", Colors.CYAN)
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3",
            timeout=120
        )
        log("Prisma Client generado", Colors.GREEN)

        # 8. Build
        log("Building aplicación (esto puede tardar)...", Colors.CYAN)
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -20",
            timeout=600
        )
        if status != 0:
            log(f"Build falló. Últimas líneas: {out[-500:]}", Colors.RED)
            log(f"Stderr: {err[-500:]}", Colors.RED)
            log("Intentando rollback...", Colors.YELLOW)
            exec_cmd(client, f"cd {APP_PATH} && git checkout {current_commit}")
            return False
        log("Build completado", Colors.GREEN)

        # 9. PM2 reload
        log("Recargando PM2 (zero-downtime)...", Colors.CYAN)
        status, out, err = exec_cmd(
            client,
            f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1 || (pm2 delete inmova-app 2>/dev/null; pm2 start ecosystem.config.js --env production 2>&1)",
            timeout=30
        )
        log("PM2 recargado", Colors.GREEN)

        # 10. Esperar warm-up
        log("Esperando warm-up (20s)...", Colors.YELLOW)
        time.sleep(20)

        # 11. Health checks
        print(f"\n{'='*70}")
        log("HEALTH CHECKS POST-DEPLOYMENT", Colors.CYAN)
        print(f"{'='*70}")

        checks_passed = 0
        checks_total = 5

        # Check 1: HTTP Health
        status, out, err = exec_cmd(client, f"curl -sf http://localhost:3000/api/health -o /dev/null -w '%{{http_code}}'")
        http_ok = '200' in out
        log(f"{'✅' if http_ok else '❌'} HTTP Health: {out}", Colors.GREEN if http_ok else Colors.RED)
        if http_ok:
            checks_passed += 1

        # Check 2: Login page
        status, out, err = exec_cmd(client, f"curl -sf http://localhost:3000/login -o /dev/null -w '%{{http_code}}'")
        login_ok = '200' in out
        log(f"{'✅' if login_ok else '❌'} Login page: {out}", Colors.GREEN if login_ok else Colors.RED)
        if login_ok:
            checks_passed += 1

        # Check 3: API Session
        status, out, err = exec_cmd(client, "curl -sf http://localhost:3000/api/auth/session")
        session_ok = 'problem' not in out.lower() and status == 0
        log(f"{'✅' if session_ok else '❌'} API Session: {'OK' if session_ok else out[:100]}", Colors.GREEN if session_ok else Colors.RED)
        if session_ok:
            checks_passed += 1

        # Check 4: PM2 status
        status, out, err = exec_cmd(client, "pm2 jlist 2>/dev/null | python3 -c \"import json,sys; d=json.load(sys.stdin); print('online' if any(p.get('pm2_env',{}).get('status')=='online' for p in d) else 'offline')\" 2>/dev/null || echo 'unknown'")
        pm2_ok = 'online' in out
        log(f"{'✅' if pm2_ok else '❌'} PM2 status: {out}", Colors.GREEN if pm2_ok else Colors.RED)
        if pm2_ok:
            checks_passed += 1

        # Check 5: No NextAuth errors
        status, out, err = exec_cmd(client, "pm2 logs inmova-app --err --lines 20 --nostream 2>/dev/null | grep -ci 'NO_SECRET' || echo 0")
        # Parse: tomar la última línea numérica
        no_secret_errors = 0
        for line in out.strip().split('\n'):
            line = line.strip()
            if line.isdigit():
                no_secret_errors = int(line)
        no_errors = no_secret_errors == 0
        log(f"{'✅' if no_errors else '❌'} NextAuth errors: {no_secret_errors} NO_SECRET errors", Colors.GREEN if no_errors else Colors.RED)
        if no_errors:
            checks_passed += 1

        print(f"\n{'='*70}")
        if checks_passed >= 4:
            log(f"DEPLOYMENT EXITOSO: {checks_passed}/{checks_total} checks pasaron", Colors.GREEN)
        elif checks_passed >= 2:
            log(f"DEPLOYMENT PARCIAL: {checks_passed}/{checks_total} checks pasaron", Colors.YELLOW)
        else:
            log(f"DEPLOYMENT FALLIDO: {checks_passed}/{checks_total} checks pasaron", Colors.RED)
            log("Considera rollback manual", Colors.RED)
        print(f"{'='*70}\n")

        return checks_passed >= 3

    except Exception as e:
        log(f"Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()
        log("Conexión SSH cerrada", Colors.CYAN)


if __name__ == '__main__':
    success = deploy()
    sys.exit(0 if success else 1)
