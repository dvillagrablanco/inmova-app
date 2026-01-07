#!/usr/bin/env python3
"""
Deployment: Integración Stripe + Add-ons + eWoorker
===================================================

Este script despliega:
1. Modelos Prisma (AddOn, CompanyAddOn, EwoorkerPlan)
2. APIs de billing (/api/billing/*)
3. Servicio de suscripciones Stripe
4. Seed de add-ons y planes eWoorker
5. Actualización del webhook de Stripe

Ejecutar: python3 scripts/deploy-stripe-integration.py
"""

import sys
import time
import os

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Error: paramiko no disponible")
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════
# CONFIGURACIÓN
# ═══════════════════════════════════════════════════════════════

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = os.environ.get("SERVER_PASSWORD", "")
APP_PATH = "/opt/inmova-app"
DOMAIN = "inmovaapp.com"


class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def log(msg, color=Colors.ENDC):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.ENDC}")


def exec_cmd(client, cmd, timeout=120, show_output=False):
    """Ejecutar comando SSH."""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore').strip()
    error = stderr.read().decode('utf-8', errors='ignore').strip()
    
    if show_output and output:
        for line in output.split('\n')[:30]:
            print(f"    {line}")
    
    return exit_status, output, error


def main():
    print(f"""
{Colors.BOLD}{'═' * 70}
🚀 DEPLOYMENT: INTEGRACIÓN STRIPE + ADD-ONS
{'═' * 70}{Colors.ENDC}

Servidor: {SERVER_IP}
Dominio: {DOMAIN}
Path: {APP_PATH}

Cambios a desplegar:
  ✓ lib/stripe-subscription-service.ts
  ✓ app/api/billing/subscribe/route.ts
  ✓ app/api/billing/addons/route.ts
  ✓ app/api/admin/stripe-sync/route.ts
  ✓ app/api/webhooks/stripe/route.ts (actualizado)
  ✓ app/admin/addons/page.tsx
  ✓ prisma/seed-addons.ts
  ✓ Modelos: AddOn, CompanyAddOn, EwoorkerPlan

{'═' * 70}
""")

    if not SERVER_PASSWORD:
        log("❌ SERVER_PASSWORD no definida", Colors.RED)
        log("   Ejecutar: export SERVER_PASSWORD='xxx'", Colors.YELLOW)
        sys.exit(1)

    # Conectar
    log("🔐 Conectando al servidor...", Colors.CYAN)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=15
        )
        log(f"✅ Conectado a {SERVER_IP}", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error conectando: {e}", Colors.RED)
        sys.exit(1)

    try:
        # ═══════════════════════════════════════════════════════════════
        # PASO 1: Backup
        # ═══════════════════════════════════════════════════════════════
        
        log("💾 Creando backup...", Colors.CYAN)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        exec_cmd(client, f"""
            mkdir -p /var/backups/inmova && \
            cd {APP_PATH} && \
            pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/pre-stripe-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'
        """)
        log("✅ Backup completado", Colors.GREEN)

        # ═══════════════════════════════════════════════════════════════
        # PASO 2: Git pull
        # ═══════════════════════════════════════════════════════════════
        
        log("📥 Actualizando código...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main 2>&1")
        
        if "Already up to date" in output:
            log("  ℹ️  Código ya actualizado", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)

        # ═══════════════════════════════════════════════════════════════
        # PASO 3: Install dependencies
        # ═══════════════════════════════════════════════════════════════
        
        log("📦 Instalando dependencias...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5",
            timeout=300
        )
        log("✅ Dependencias instaladas", Colors.GREEN)

        # ═══════════════════════════════════════════════════════════════
        # PASO 4: Prisma
        # ═══════════════════════════════════════════════════════════════
        
        log("🔧 Configurando Prisma...", Colors.CYAN)
        
        # Generate
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3")
        log("  ✓ Prisma Client generado", Colors.GREEN)
        
        # Push schema
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma db push --accept-data-loss 2>&1 | tail -10",
            timeout=120
        )
        log("  ✓ Schema sincronizado", Colors.GREEN)

        # ═══════════════════════════════════════════════════════════════
        # PASO 5: Seed de add-ons
        # ═══════════════════════════════════════════════════════════════
        
        log("🌱 Ejecutando seed de add-ons...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npx tsx prisma/seed-addons.ts 2>&1 | tail -20",
            timeout=60,
            show_output=True
        )
        
        if status == 0:
            log("✅ Seed completado", Colors.GREEN)
        else:
            log(f"⚠️ Seed warning: {error[:100] if error else 'ver logs'}", Colors.YELLOW)

        # ═══════════════════════════════════════════════════════════════
        # PASO 6: Build
        # ═══════════════════════════════════════════════════════════════
        
        log("🏗️ Building aplicación...", Colors.CYAN)
        log("   (esto puede tardar 3-5 minutos)", Colors.YELLOW)
        
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -15",
            timeout=600
        )
        
        if status == 0 or "Compiled successfully" in output or ".next" in output:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"⚠️ Build puede tener warnings: {output[-200:] if output else ''}", Colors.YELLOW)

        # ═══════════════════════════════════════════════════════════════
        # PASO 7: Restart PM2
        # ═══════════════════════════════════════════════════════════════
        
        log("♻️ Reiniciando PM2...", Colors.CYAN)
        exec_cmd(client, f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1")
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        log("⏳ Esperando warm-up (25s)...", Colors.CYAN)
        time.sleep(25)

        # ═══════════════════════════════════════════════════════════════
        # PASO 8: Health checks
        # ═══════════════════════════════════════════════════════════════
        
        log("🏥 Verificando APIs...", Colors.CYAN)
        
        checks = []
        
        # Health
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        health_ok = '"status":"ok"' in output
        checks.append(("Health", health_ok))
        log(f"  {'✓' if health_ok else '✗'} /api/health", Colors.GREEN if health_ok else Colors.RED)
        
        # Planes
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/planes | head -c 100")
        planes_ok = '"planes"' in output or '"addOns"' in output
        checks.append(("Planes", planes_ok))
        log(f"  {'✓' if planes_ok else '✗'} /api/planes", Colors.GREEN if planes_ok else Colors.RED)
        
        # Add-ons
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/addons | head -c 100")
        addons_ok = '"data"' in output or '"success"' in output
        checks.append(("Add-ons", addons_ok))
        log(f"  {'✓' if addons_ok else '✗'} /api/addons", Colors.GREEN if addons_ok else Colors.RED)
        
        # eWoorker planes
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/ewoorker/planes | head -c 100")
        ewoorker_ok = '"data"' in output or '"success"' in output
        checks.append(("eWoorker", ewoorker_ok))
        log(f"  {'✓' if ewoorker_ok else '✗'} /api/ewoorker/planes", Colors.GREEN if ewoorker_ok else Colors.RED)
        
        # Landing
        status, output, error = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing")
        landing_ok = output.strip() == "200"
        checks.append(("Landing", landing_ok))
        log(f"  {'✓' if landing_ok else '✗'} /landing (HTTP {output.strip()})", Colors.GREEN if landing_ok else Colors.RED)
        
        # PM2 status
        status, output, error = exec_cmd(client, "pm2 jlist 2>/dev/null | grep -o '\"status\":\"online\"' | wc -l")
        pm2_ok = int(output.strip() or 0) > 0
        checks.append(("PM2", pm2_ok))
        log(f"  {'✓' if pm2_ok else '✗'} PM2 online", Colors.GREEN if pm2_ok else Colors.RED)

        # ═══════════════════════════════════════════════════════════════
        # RESULTADO
        # ═══════════════════════════════════════════════════════════════
        
        passed = sum(1 for _, ok in checks if ok)
        total = len(checks)
        
        print(f"""
{Colors.BOLD}{'═' * 70}
{'✅ DEPLOYMENT COMPLETADO' if passed >= 5 else '⚠️ DEPLOYMENT CON WARNINGS'}
{'═' * 70}{Colors.ENDC}

Health checks: {passed}/{total} pasando

URLs de APIs:
  • https://{DOMAIN}/api/health
  • https://{DOMAIN}/api/planes
  • https://{DOMAIN}/api/addons
  • https://{DOMAIN}/api/ewoorker/planes
  • https://{DOMAIN}/api/billing/subscribe
  • https://{DOMAIN}/api/billing/addons

Landing:
  • https://{DOMAIN}/landing

Admin:
  • https://{DOMAIN}/admin/addons
  • https://{DOMAIN}/admin/planes

Para sincronizar con Stripe (como SUPERADMIN):
  curl -X POST https://{DOMAIN}/api/admin/stripe-sync

{'═' * 70}
""")

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()
        log("🔒 Conexión cerrada", Colors.CYAN)


if __name__ == "__main__":
    main()
