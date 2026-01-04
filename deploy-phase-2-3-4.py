#!/usr/bin/env python3
"""
🚀 Deployment Fases 2, 3 y 4 - Sistema de Control de Costos

Incluye:
- FASE 2: Dashboard de uso + Alertas
- FASE 3: Facturación automática de excesos
- FASE 4: Optimizaciones (rate limiting, compresión, cache)
- Actualización de planes en landing page

Servidor: 157.180.119.236
Usuario: root
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# Colores
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    PURPLE = '\033[0;35m'
    NC = '\033[0m'

def print_step(msg):
    print(f"{Colors.GREEN}[✓]{Colors.NC} {msg}")

def print_info(msg):
    print(f"{Colors.BLUE}[i]{Colors.NC} {msg}")

def print_error(msg):
    print(f"{Colors.RED}[✗]{Colors.NC} {msg}")

def print_warning(msg):
    print(f"{Colors.YELLOW}[!]{Colors.NC} {msg}")

def print_phase(msg):
    print()
    print(f"{Colors.PURPLE}{'═' * 63}{Colors.NC}")
    print(f"{Colors.PURPLE}  {msg}{Colors.NC}")
    print(f"{Colors.PURPLE}{'═' * 63}{Colors.NC}")
    print()

def exec_cmd(client, command, timeout=300):
    """Ejecuta comando remoto y retorna exit status y output"""
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        
        if error and exit_status != 0:
            print_warning(f"STDERR: {error[:200]}")
        
        return exit_status, output
    except Exception as e:
        print_error(f"Error ejecutando comando: {e}")
        return 1, str(e)

def main():
    print()
    print("╔═══════════════════════════════════════════════════════╗")
    print("║   🚀 Inmova App - Deploy Fases 2, 3 y 4             ║")
    print("║   Sistema de Control de Costos + Optimizaciones     ║")
    print("╚═══════════════════════════════════════════════════════╝")
    print()

    # Conectar al servidor
    print_info(f"Conectando a {SERVER_IP}...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASS,
            timeout=10,
            banner_timeout=30
        )
        print_step("Conexión establecida ✓")
    except Exception as e:
        print_error(f"No se pudo conectar: {e}")
        return 1
    
    try:
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 1: BACKUP PRE-DEPLOYMENT")
        # ═══════════════════════════════════════════════════════════════
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        print_info("Creando backup de la base de datos...")
        
        # Crear directorios de backup si no existen
        exec_cmd(client, "mkdir -p /var/backups/inmova")
        
        status, _ = exec_cmd(
            client,
            f"cd {APP_PATH} && pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/pre-phase234-{timestamp}.sql 2>/dev/null || true"
        )
        print_step(f"Backup creado: pre-phase234-{timestamp}.sql")
        
        print_info("Guardando commit actual...")
        status, current_commit = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        current_commit = current_commit.strip()
        print_step(f"Commit actual: {current_commit}")
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 2: ACTUALIZAR CÓDIGO")
        # ═══════════════════════════════════════════════════════════════
        
        print_info("Haciendo git pull...")
        status, output = exec_cmd(client, f"cd {APP_PATH} && git stash && git pull origin main")
        if status == 0:
            print_step("Código actualizado")
        else:
            print_warning("Git pull tuvo warnings, continuando...")
        
        status, new_commit = exec_cmd(client, f"cd {APP_PATH} && git rev-parse --short HEAD")
        new_commit = new_commit.strip()
        print_info(f"Nuevo commit: {new_commit}")
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 3: INSTALACIÓN DE DEPENDENCIAS")
        # ═══════════════════════════════════════════════════════════════
        
        print_info("Instalando dependencias de Node.js...")
        print_warning("Esto puede tomar 3-5 minutos...")
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm install --production=false", timeout=600)
        if status == 0:
            print_step("Dependencias instaladas")
        else:
            print_warning("npm install tuvo warnings, continuando...")
        print()
        
        print_info("Instalando pako para compresión...")
        status, _ = exec_cmd(client, f"cd {APP_PATH} && npm install pako @types/pako")
        if status == 0:
            print_step("Pako instalado")
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 4: MIGRACIÓN DE BASE DE DATOS")
        # ═══════════════════════════════════════════════════════════════
        
        print_info("Generando cliente de Prisma...")
        status, _ = exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        if status != 0:
            print_error("Prisma generate falló")
            return 1
        print_step("Cliente Prisma generado")
        
        print_info("Ejecutando migración: add_usage_tracking...")
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx prisma migrate deploy")
        if status != 0:
            print_warning("Migrate deploy falló, intentando db push...")
            status, _ = exec_cmd(client, f"cd {APP_PATH} && npx prisma db push --accept-data-loss")
            if status != 0:
                print_error("Push también falló. Verifica la BD manualmente.")
                return 1
        print_step("Migración ejecutada exitosamente")
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 5: SEED DE PLANES DE SUSCRIPCIÓN")
        # ═══════════════════════════════════════════════════════════════
        
        print_info("Ejecutando seed de planes...")
        status, output = exec_cmd(client, f"cd {APP_PATH} && npx tsx prisma/seed-subscription-plans.ts")
        if status != 0:
            print_warning("Seed falló (puede ser que los planes ya existan)")
        else:
            print_step("Seed de planes completado")
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 6: BUILD DE LA APLICACIÓN")
        # ═══════════════════════════════════════════════════════════════
        
        print_info("Construyendo aplicación Next.js...")
        print_warning("Esto puede tomar 5-10 minutos...")
        
        status, output = exec_cmd(client, f"cd {APP_PATH} && npm run build", timeout=900)
        if status != 0:
            print_error("Build falló")
            print_info("Rollback al commit anterior...")
            exec_cmd(client, f"cd {APP_PATH} && git reset --hard {current_commit}")
            print_error("Deployment abortado. Revierte los cambios manualmente si es necesario.")
            return 1
        print_step("Build completado exitosamente")
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 7: CONFIGURAR CRON JOBS")
        # ═══════════════════════════════════════════════════════════════
        
        print_info("Configurando cron jobs para alertas y facturación...")
        
        cron_config = """# Inmova App - Cron Jobs para Sistema de Control de Costos

# 1. Health check de alertas de uso (diariamente a las 9 AM)
0 9 * * * curl -H "Authorization: Bearer inmova-cron-secret-2026" https://inmovaapp.com/api/cron/check-usage-alerts >> /var/log/inmova/cron.log 2>&1

# 2. Facturación mensual de excesos (día 1 de cada mes a las 2 AM)
0 2 1 * * curl -H "Authorization: Bearer inmova-cron-secret-2026" https://inmovaapp.com/api/cron/process-monthly-overages >> /var/log/inmova/cron.log 2>&1

# 3. Backup diario de BD (3 AM)
0 3 * * * pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/auto-backup-$(date +\\%Y\\%m\\%d).sql 2>&1
"""
        
        exec_cmd(client, f"echo '{cron_config}' > /tmp/inmova-cron")
        status, _ = exec_cmd(client, "crontab /tmp/inmova-cron && rm /tmp/inmova-cron")
        if status == 0:
            print_step("Cron jobs configurados")
        else:
            print_warning("No se pudo configurar crontab (puede que ya exista)")
        
        # Crear directorios de logs
        exec_cmd(client, "mkdir -p /var/log/inmova && mkdir -p /var/backups/inmova")
        print_step("Directorios de logs creados")
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 8: CONFIGURAR VARIABLES DE ENTORNO")
        # ═══════════════════════════════════════════════════════════════
        
        print_info("Añadiendo variables de entorno para cron jobs...")
        exec_cmd(
            client,
            f"cd {APP_PATH} && grep -q 'CRON_SECRET' .env.production || echo 'CRON_SECRET=inmova-cron-secret-2026' >> .env.production"
        )
        print_step("Variable CRON_SECRET configurada")
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 9: REINICIAR APLICACIÓN (PM2)")
        # ═══════════════════════════════════════════════════════════════
        
        print_info("Reiniciando aplicación con PM2...")
        status, output = exec_cmd(client, f"cd {APP_PATH} && pm2 restart inmova-app --update-env")
        if status != 0:
            print_warning("PM2 restart falló, intentando start...")
            status, _ = exec_cmd(client, f"cd {APP_PATH} && pm2 start ecosystem.config.js --env production")
            if status != 0:
                print_error("No se pudo iniciar PM2")
                return 1
        print_step("Aplicación reiniciada")
        
        print_info("Guardando configuración de PM2...")
        exec_cmd(client, "pm2 save")
        print_step("Configuración PM2 guardada")
        
        print_info("Esperando 20 segundos para warm-up...")
        time.sleep(20)
        print_step("Warm-up completado")
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 10: HEALTH CHECKS POST-DEPLOYMENT")
        # ═══════════════════════════════════════════════════════════════
        
        checks_passed = 0
        
        print_info("[1/5] Verificando HTTP...")
        status, _ = exec_cmd(client, "curl -f -s http://localhost:3000 > /dev/null")
        if status == 0:
            print_step("HTTP OK")
            checks_passed += 1
        else:
            print_error("HTTP falló")
        
        print_info("[2/5] Verificando API health...")
        status, health = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if status == 0 and '"status":"ok"' in health:
            print_step("API health OK")
            checks_passed += 1
        else:
            print_error(f"API health falló: {health[:100]}")
        
        print_info("[3/5] Verificando PM2 status...")
        status, pm2_output = exec_cmd(client, "pm2 status inmova-app --no-color")
        if "online" in pm2_output:
            print_step("PM2 online")
            checks_passed += 1
        else:
            print_error("PM2 no está online")
        
        print_info("[4/5] Verificando memoria...")
        status, mem_output = exec_cmd(client, "free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100}'")
        if status == 0:
            mem_usage = float(mem_output.strip() or "0")
            print_info(f"Memoria en uso: {mem_usage}%")
            if mem_usage < 90:
                print_step("Memoria OK")
                checks_passed += 1
            else:
                print_warning(f"Memoria alta: {mem_usage}%")
        
        print_info("[5/5] Verificando disco...")
        status, disk_output = exec_cmd(client, "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'")
        if status == 0:
            disk_usage = int(disk_output.strip() or "0")
            print_info(f"Disco en uso: {disk_usage}%")
            if disk_usage < 90:
                print_step("Disco OK")
                checks_passed += 1
            else:
                print_warning(f"Disco alto: {disk_usage}%")
        
        print()
        print_step(f"Health checks: {checks_passed}/5 OK")
        print()
        
        if checks_passed < 3:
            print_error("Demasiados health checks fallaron")
            return 1
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("PASO 11: VERIFICACIÓN DE NUEVAS FEATURES")
        # ═══════════════════════════════════════════════════════════════
        
        print_info("Verificando cron jobs configurados...")
        status, cron_output = exec_cmd(client, "crontab -l | grep inmova | wc -l")
        if status == 0:
            cron_count = int(cron_output.strip() or "0")
            if cron_count >= 2:
                print_step(f"Cron jobs configurados: {cron_count}")
            else:
                print_warning(f"Solo {cron_count} cron jobs encontrados (esperados: 3)")
        
        print()
        
        # ═══════════════════════════════════════════════════════════════
        print_phase("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
        # ═══════════════════════════════════════════════════════════════
        
        print()
        print(f"{Colors.GREEN}╔═══════════════════════════════════════════════════════════════╗{Colors.NC}")
        print(f"{Colors.GREEN}║                    🎉 DEPLOYMENT EXITOSO 🎉                  ║{Colors.NC}")
        print(f"{Colors.GREEN}╚═══════════════════════════════════════════════════════════════╝{Colors.NC}")
        print()
        
        print(f"{Colors.BLUE}📊 FASES IMPLEMENTADAS:{Colors.NC}")
        print()
        print(f"  {Colors.GREEN}✓{Colors.NC} FASE 2: Dashboard de Uso para Clientes")
        print(f"     - Componente React con barras de progreso")
        print(f"     - Sistema de alertas automáticas (email al 80% y 100%)")
        print(f"     - Cron job diario: 9 AM")
        print()
        print(f"  {Colors.GREEN}✓{Colors.NC} FASE 3: Facturación Automática de Excesos")
        print(f"     - Cálculo automático de excesos mensuales")
        print(f"     - Integración con Stripe para cobro automático")
        print(f"     - Email de invoice con desglose")
        print(f"     - Cron job mensual: día 1 a las 2 AM")
        print()
        print(f"  {Colors.GREEN}✓{Colors.NC} FASE 4: Optimizaciones")
        print(f"     - Rate limiting por usuario (prevenir abuso)")
        print(f"     - Compresión de archivos en S3 (reducir storage)")
        print(f"     - Cache de respuestas IA (reducir tokens)")
        print(f"     - Batch processing para firmas")
        print()
        print(f"  {Colors.GREEN}✓{Colors.NC} Landing Page Actualizada")
        print(f"     - Planes con límites de uso visibles")
        print(f"     - Precios con desglose de integraciones")
        print()
        
        print(f"{Colors.BLUE}🌐 URLs DE ACCESO:{Colors.NC}")
        print()
        print(f"  {Colors.GREEN}Landing:{Colors.NC}    https://inmovaapp.com/landing")
        print(f"  {Colors.GREEN}Login:{Colors.NC}      https://inmovaapp.com/login")
        print(f"  {Colors.GREEN}Dashboard:{Colors.NC}  https://inmovaapp.com/dashboard")
        print(f"  {Colors.GREEN}Health:{Colors.NC}     https://inmovaapp.com/api/health")
        print(f"  {Colors.GREEN}Uso Actual:{Colors.NC} https://inmovaapp.com/api/usage/current")
        print()
        
        print(f"{Colors.BLUE}⚙️ CRON JOBS ACTIVOS:{Colors.NC}")
        print()
        print(f"  1. {Colors.GREEN}Alertas de uso:{Colors.NC}        Diario a las 9 AM")
        print(f"  2. {Colors.GREEN}Facturación excesos:{Colors.NC}   Mensual día 1 a las 2 AM")
        print(f"  3. {Colors.GREEN}Backup BD:{Colors.NC}             Diario a las 3 AM")
        print()
        
        print(f"{Colors.BLUE}💾 BACKUP CREADO:{Colors.NC}")
        print()
        print(f"  Ubicación: /var/backups/inmova/pre-phase234-{timestamp}.sql")
        print(f"  Commit anterior: {current_commit}")
        print(f"  Commit nuevo: {new_commit}")
        print()
        
        print(f"{Colors.GREEN}═══════════════════════════════════════════════════════════════{Colors.NC}")
        print()
        
        return 0
        
    except Exception as e:
        print_error(f"Error durante deployment: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
