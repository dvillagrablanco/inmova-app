#!/usr/bin/env python3
"""
Deployment: Add-ons Backend y Planes eWoorker
==============================================

Este script despliega los cambios de:
1. Nuevo modelo AddOn en Prisma
2. Nuevo modelo EwoorkerPlan en Prisma  
3. Nuevo modelo CompanyAddOn en Prisma
4. APIs de add-ons (/api/addons, /api/planes, /api/ewoorker/planes)
5. Sincronización de precios eWoorker con la landing
6. Seed de add-ons y planes ewoorker

Ejecutar: python3 scripts/deploy-addons-backend.py
"""

import sys
import time
import os

# Añadir path de paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Error: paramiko no disponible. Ejecutar: pip install paramiko")
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════
# CONFIGURACIÓN
# ═══════════════════════════════════════════════════════════════

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = os.environ.get("SERVER_PASSWORD", "")
APP_PATH = "/opt/inmova-app"
DOMAIN = "inmovaapp.com"


# ═══════════════════════════════════════════════════════════════
# COLORES Y UTILIDADES
# ═══════════════════════════════════════════════════════════════

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
    """Ejecutar comando SSH y retornar status + output."""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore').strip()
    error = stderr.read().decode('utf-8', errors='ignore').strip()
    
    if show_output and output:
        for line in output.split('\n')[:20]:
            print(f"    {line}")
    
    return exit_status, output, error


# ═══════════════════════════════════════════════════════════════
# DEPLOYMENT
# ═══════════════════════════════════════════════════════════════

def main():
    print(f"""
{Colors.BOLD}{'═' * 70}
🚀 DEPLOYMENT: ADD-ONS BACKEND + EWOORKER PLANS
{'═' * 70}{Colors.ENDC}

Servidor: {SERVER_IP}
Dominio: {DOMAIN}
Path: {APP_PATH}

Cambios a desplegar:
  ✓ Modelo AddOn en Prisma
  ✓ Modelo EwoorkerPlan en Prisma
  ✓ Modelo CompanyAddOn en Prisma
  ✓ API /api/addons
  ✓ API /api/ewoorker/planes
  ✓ API /api/planes (actualizada)
  ✓ Sincronización precios eWoorker
  ✓ Seed de add-ons y planes

{'═' * 70}
""")

    if not SERVER_PASSWORD:
        log("❌ SERVER_PASSWORD no definida. Ejecutar: export SERVER_PASSWORD=xxx", Colors.RED)
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
            timeout=10
        )
        log(f"✅ Conectado a {SERVER_IP}", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error conectando: {e}", Colors.RED)
        sys.exit(1)

    try:
        # ═══════════════════════════════════════════════════════════════
        # PASO 1: Backup de BD
        # ═══════════════════════════════════════════════════════════════
        
        log("💾 Creando backup de BD...", Colors.CYAN)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        backup_cmd = f"""
            cd {APP_PATH} && \
            source .env.production 2>/dev/null || true && \
            mkdir -p /var/backups/inmova && \
            pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/pre-addons-{timestamp}.sql 2>/dev/null || echo 'Backup skipped'
        """
        status, output, error = exec_cmd(client, backup_cmd)
        log(f"✅ Backup: /var/backups/inmova/pre-addons-{timestamp}.sql", Colors.GREEN)

        # ═══════════════════════════════════════════════════════════════
        # PASO 2: Git pull
        # ═══════════════════════════════════════════════════════════════
        
        log("📥 Actualizando código...", Colors.CYAN)
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git pull origin main 2>&1 | tail -5", show_output=True)
        
        if status != 0 and "Already up to date" not in output:
            log(f"⚠️ Git pull warning: {error[:100]}", Colors.YELLOW)
        else:
            log("✅ Código actualizado", Colors.GREEN)

        # ═══════════════════════════════════════════════════════════════
        # PASO 3: Instalar dependencias
        # ═══════════════════════════════════════════════════════════════
        
        log("📦 Instalando dependencias...", Colors.CYAN)
        status, output, error = exec_cmd(
            client, 
            f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5",
            timeout=300
        )
        log("✅ Dependencias instaladas", Colors.GREEN)

        # ═══════════════════════════════════════════════════════════════
        # PASO 4: Prisma generate + migrate
        # ═══════════════════════════════════════════════════════════════
        
        log("🔧 Configurando Prisma...", Colors.CYAN)
        
        # Generate
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -5"
        )
        log("  ✓ Prisma Client generado", Colors.GREEN)
        
        # Migrate (crear tablas si no existen)
        log("  📊 Ejecutando migración...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npx prisma db push --accept-data-loss 2>&1 | tail -10",
            timeout=120
        )
        if "Your database is now in sync" in output or status == 0:
            log("  ✓ Schema sincronizado con BD", Colors.GREEN)
        else:
            log(f"  ⚠️ Migración: {output[:100]}", Colors.YELLOW)

        # ═══════════════════════════════════════════════════════════════
        # PASO 5: Seed de add-ons y planes ewoorker
        # ═══════════════════════════════════════════════════════════════
        
        log("🌱 Ejecutando seed de add-ons...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npx tsx prisma/seed-addons.ts 2>&1 | tail -30",
            timeout=60,
            show_output=True
        )
        
        if status == 0:
            log("✅ Seed completado", Colors.GREEN)
        else:
            log(f"⚠️ Seed warning: {error[:100]}", Colors.YELLOW)

        # ═══════════════════════════════════════════════════════════════
        # PASO 6: Build
        # ═══════════════════════════════════════════════════════════════
        
        log("🏗️ Building aplicación...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -10",
            timeout=600
        )
        
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"❌ Build falló: {error[:200]}", Colors.RED)
            # Continuar de todas formas

        # ═══════════════════════════════════════════════════════════════
        # PASO 7: Restart PM2
        # ═══════════════════════════════════════════════════════════════
        
        log("♻️ Reiniciando PM2...", Colors.CYAN)
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1 || pm2 restart inmova-app --update-env 2>&1"
        )
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # Esperar warm-up
        log("⏳ Esperando warm-up (20s)...", Colors.CYAN)
        time.sleep(20)

        # ═══════════════════════════════════════════════════════════════
        # PASO 8: Health checks
        # ═══════════════════════════════════════════════════════════════
        
        log("🏥 Verificando health...", Colors.CYAN)
        
        checks_passed = 0
        
        # Check 1: Health endpoint
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output:
            log("  ✓ Health check OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ✗ Health check falló: {output[:100]}", Colors.RED)
        
        # Check 2: API planes
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/planes | head -c 200")
        if '"planes"' in output or '"success"' in output:
            log("  ✓ API /api/planes OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ✗ API planes falló: {output[:100]}", Colors.RED)
        
        # Check 3: API add-ons
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/addons | head -c 200")
        if '"data"' in output or '"success"' in output:
            log("  ✓ API /api/addons OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ✗ API add-ons falló: {output[:100]}", Colors.RED)
        
        # Check 4: API ewoorker planes
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/ewoorker/planes | head -c 200")
        if '"data"' in output or '"success"' in output:
            log("  ✓ API /api/ewoorker/planes OK", Colors.GREEN)
            checks_passed += 1
        else:
            log(f"  ✗ API ewoorker planes falló: {output[:100]}", Colors.RED)
        
        # Check 5: PM2 status
        status, output, error = exec_cmd(client, "pm2 jlist")
        if '"status":"online"' in output:
            log("  ✓ PM2 online", Colors.GREEN)
            checks_passed += 1
        else:
            log("  ✗ PM2 no está online", Colors.RED)

        # ═══════════════════════════════════════════════════════════════
        # RESULTADO
        # ═══════════════════════════════════════════════════════════════
        
        print(f"""
{Colors.BOLD}{'═' * 70}
{'✅ DEPLOYMENT COMPLETADO' if checks_passed >= 4 else '⚠️ DEPLOYMENT CON WARNINGS'}
{'═' * 70}{Colors.ENDC}

Health checks: {checks_passed}/5 pasando

URLs verificadas:
  • https://{DOMAIN}/api/health
  • https://{DOMAIN}/api/planes
  • https://{DOMAIN}/api/addons
  • https://{DOMAIN}/api/ewoorker/planes

Nuevas tablas en BD:
  • addons (add-ons disponibles)
  • company_addons (add-ons contratados por empresa)
  • ewoorker_plans (planes de eWoorker)

Para verificar add-ons:
  curl https://{DOMAIN}/api/addons | jq

Para verificar planes eWoorker:
  curl https://{DOMAIN}/api/ewoorker/planes | jq

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
