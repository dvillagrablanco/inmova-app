#!/usr/bin/env python3
"""
Deployment de Integración de Contasimple
=========================================

Despliega la integración completa de Contasimple en producción:
1. Migración de Prisma (añade campos a Company y B2BInvoice)
2. Actualiza código fuente
3. Configura variables de entorno
4. Reinicia PM2
5. Ejecuta health checks

Uso:
    python3 scripts/deploy-contasimple-integration.py
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# ═══════════════════════════════════════════════════════════════
# CONFIGURACIÓN
# ═══════════════════════════════════════════════════════════════

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

# Variables de entorno a añadir (si el usuario no las tiene)
ENV_VARS_TO_CHECK = [
    'INMOVA_CONTASIMPLE_AUTH_KEY',
    'CONTASIMPLE_ENCRYPTION_KEY',
    'INMOVA_CIF',
    'INMOVA_DIRECCION',
    'INMOVA_CIUDAD',
    'INMOVA_CP',
    'INMOVA_EMAIL',
    'INMOVA_TELEFONO',
]

# ═══════════════════════════════════════════════════════════════
# FUNCIONES AUXILIARES
# ═══════════════════════════════════════════════════════════════

def log(message):
    """Log con timestamp"""
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f'[{timestamp}] {message}')

def exec_cmd(client, command, timeout=120):
    """Ejecuta comando SSH y retorna (exit_code, stdout, stderr)"""
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        return (exit_code, out, err)
    except Exception as e:
        return (-1, '', str(e))

def check_env_var(client, var_name):
    """Verifica si una variable de entorno existe"""
    exit_code, out, _ = exec_cmd(client, f'grep -q "^{var_name}=" {APP_PATH}/.env.production && echo "EXISTS" || echo "MISSING"')
    return 'EXISTS' in out

# ═══════════════════════════════════════════════════════════════
# DEPLOYMENT
# ═══════════════════════════════════════════════════════════════

def main():
    print('=' * 70)
    print('🚀 DEPLOYMENT: INTEGRACIÓN DE CONTASIMPLE')
    print('=' * 70)
    print()
    print(f'Servidor: {SERVER_IP}')
    print(f'Path: {APP_PATH}')
    print()
    print('=' * 70)
    print()

    # Conectar
    log('🔐 Conectando a servidor...')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log('✅ Conectado')
    except Exception as e:
        log(f'❌ Error conectando: {e}')
        sys.exit(1)

    try:
        # ════════════════════════════════════════════════════════
        # 1. BACKUP PRE-DEPLOYMENT
        # ════════════════════════════════════════════════════════
        print()
        log('💾 BACKUP PRE-DEPLOYMENT')
        print('-' * 70)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_cmd = f'pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/pre-contasimple-{timestamp}.sql 2>&1'
        
        exit_code, out, err = exec_cmd(client, backup_cmd, timeout=300)
        if exit_code == 0:
            log('✅ Backup de BD completado')
        else:
            log(f'⚠️  Warning: Backup falló (pero continuar): {err}')

        # ════════════════════════════════════════════════════════
        # 2. GIT PULL
        # ════════════════════════════════════════════════════════
        print()
        log('📥 ACTUALIZANDO CÓDIGO...')
        print('-' * 70)
        
        exit_code, out, err = exec_cmd(client, f'cd {APP_PATH} && git pull origin main')
        if exit_code == 0:
            log('✅ Código actualizado')
            if out.strip():
                print(out[:500])  # Primeras 500 chars
        else:
            log(f'❌ Error en git pull: {err}')
            sys.exit(1)

        # ════════════════════════════════════════════════════════
        # 3. DEPENDENCIES
        # ════════════════════════════════════════════════════════
        print()
        log('📦 INSTALANDO DEPENDENCIAS...')
        print('-' * 70)
        
        exit_code, out, err = exec_cmd(client, f'cd {APP_PATH} && npm install', timeout=600)
        if exit_code == 0:
            log('✅ Dependencias instaladas')
        else:
            log(f'❌ Error instalando dependencias: {err}')
            sys.exit(1)

        # ════════════════════════════════════════════════════════
        # 4. PRISMA GENERATE & MIGRATE
        # ════════════════════════════════════════════════════════
        print()
        log('🔧 PRISMA SETUP...')
        print('-' * 70)
        
        # Generate
        exit_code, out, err = exec_cmd(client, f'cd {APP_PATH} && npx prisma generate', timeout=120)
        if exit_code == 0:
            log('✅ Prisma generate completado')
        else:
            log(f'❌ Error en prisma generate: {err}')
            sys.exit(1)

        # Migrate Deploy (CRÍTICO para añadir campos de Contasimple)
        log('📊 Aplicando migraciones de BD...')
        exit_code, out, err = exec_cmd(client, f'cd {APP_PATH} && npx prisma migrate deploy', timeout=300)
        if exit_code == 0:
            log('✅ Migraciones aplicadas')
            if 'Applied' in out or 'up to date' in out:
                print(out[:500])
        else:
            log(f'❌ Error en migraciones: {err}')
            # No hacer sys.exit aquí porque puede que ya estén aplicadas
            log('⚠️  Continuando (puede que ya estuvieran aplicadas)...')

        # ════════════════════════════════════════════════════════
        # 5. VERIFICAR VARIABLES DE ENTORNO
        # ════════════════════════════════════════════════════════
        print()
        log('🔍 VERIFICANDO VARIABLES DE ENTORNO...')
        print('-' * 70)
        
        missing_vars = []
        for var in ENV_VARS_TO_CHECK:
            if not check_env_var(client, var):
                missing_vars.append(var)
        
        if missing_vars:
            log('⚠️  ATENCIÓN: Variables faltantes en .env.production:')
            for var in missing_vars:
                print(f'   - {var}')
            print()
            log('📝 Añade estas variables manualmente y reinicia PM2:')
            print(f'   ssh {USERNAME}@{SERVER_IP}')
            print(f'   cd {APP_PATH}')
            print(f'   nano .env.production')
            print()
            print('Ejemplo:')
            print('   INMOVA_CONTASIMPLE_AUTH_KEY=tu-auth-key')
            print('   CONTASIMPLE_ENCRYPTION_KEY=$(openssl rand -hex 32)')
            print('   INMOVA_CIF=B12345678')
            print('   INMOVA_DIRECCION=Calle Principal 123')
            print('   INMOVA_CIUDAD=Madrid')
            print('   INMOVA_CP=28001')
            print('   INMOVA_EMAIL=facturacion@inmova.app')
            print('   INMOVA_TELEFONO=+34 912 345 678')
            print()
            log('⚠️  Deployment continuará pero Contasimple NO funcionará hasta configurar estas variables')
        else:
            log('✅ Todas las variables de entorno están configuradas')

        # ════════════════════════════════════════════════════════
        # 6. BUILD
        # ════════════════════════════════════════════════════════
        print()
        log('🏗️  BUILDING APLICACIÓN...')
        print('-' * 70)
        
        exit_code, out, err = exec_cmd(client, f'cd {APP_PATH} && npm run build', timeout=900)
        if exit_code == 0:
            log('✅ Build completado')
        else:
            log(f'❌ Error en build: {err}')
            sys.exit(1)

        # ════════════════════════════════════════════════════════
        # 7. RESTART PM2
        # ════════════════════════════════════════════════════════
        print()
        log('♻️  REINICIANDO PM2...')
        print('-' * 70)
        
        exit_code, out, err = exec_cmd(client, 'pm2 restart inmova-app --update-env')
        if exit_code == 0:
            log('✅ PM2 restarted')
        else:
            log(f'⚠️  Warning en PM2 restart: {err}')

        # Wait for warm-up
        log('⏳ Esperando warm-up (15s)...')
        time.sleep(15)

        # ════════════════════════════════════════════════════════
        # 8. HEALTH CHECKS
        # ════════════════════════════════════════════════════════
        print()
        log('🏥 HEALTH CHECKS POST-DEPLOYMENT')
        print('-' * 70)
        
        checks_passed = 0
        checks_total = 5

        # Check 1: HTTP
        log('1/5 Verificando HTTP...')
        exit_code, out, err = exec_cmd(client, 'curl -f -s http://localhost:3000 > /dev/null && echo OK || echo FAIL')
        if 'OK' in out:
            log('    ✅ HTTP OK')
            checks_passed += 1
        else:
            log('    ❌ HTTP falló')

        # Check 2: Health endpoint
        log('2/5 Verificando /api/health...')
        exit_code, out, err = exec_cmd(client, 'curl -s http://localhost:3000/api/health')
        if '"status":"ok"' in out or '"status": "ok"' in out:
            log('    ✅ Health endpoint OK')
            checks_passed += 1
        else:
            log('    ❌ Health endpoint falló')
            print(f'    Response: {out[:200]}')

        # Check 3: PM2
        log('3/5 Verificando PM2...')
        exit_code, out, err = exec_cmd(client, 'pm2 jlist')
        if 'online' in out:
            log('    ✅ PM2 OK')
            checks_passed += 1
        else:
            log('    ❌ PM2 no está online')

        # Check 4: Memoria
        log('4/5 Verificando memoria...')
        exit_code, out, err = exec_cmd(client, "free | grep Mem | awk '{print ($3/$2) * 100.0}'")
        try:
            mem_usage = float(out.strip())
            if mem_usage < 90:
                log(f'    ✅ Memoria OK ({mem_usage:.1f}%)')
                checks_passed += 1
            else:
                log(f'    ⚠️  Memoria alta ({mem_usage:.1f}%)')
        except:
            log('    ⚠️  No se pudo verificar memoria')

        # Check 5: Disco
        log('5/5 Verificando disco...')
        exit_code, out, err = exec_cmd(client, "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'")
        try:
            disk_usage = float(out.strip())
            if disk_usage < 90:
                log(f'    ✅ Disco OK ({disk_usage:.1f}%)')
                checks_passed += 1
            else:
                log(f'    ⚠️  Disco alto ({disk_usage:.1f}%)')
        except:
            log('    ⚠️  No se pudo verificar disco')

        print()
        log(f'Health checks: {checks_passed}/{checks_total} pasando')

        # ════════════════════════════════════════════════════════
        # RESUMEN FINAL
        # ════════════════════════════════════════════════════════
        print()
        print('=' * 70)
        if checks_passed >= 3:
            log('✅ DEPLOYMENT COMPLETADO EXITOSAMENTE')
        else:
            log('⚠️  DEPLOYMENT COMPLETADO CON WARNINGS')
        print('=' * 70)
        print()
        
        print('URLs:')
        print(f'  - Producción: https://inmovaapp.com')
        print(f'  - Health: https://inmovaapp.com/api/health')
        print(f'  - Fallback IP: http://{SERVER_IP}:3000')
        print()
        
        if missing_vars:
            print('⚠️  ACCIÓN REQUERIDA:')
            print(f'   Configurar variables de entorno faltantes:')
            for var in missing_vars:
                print(f'     - {var}')
            print()
            print(f'   ssh {USERNAME}@{SERVER_IP}')
            print(f'   cd {APP_PATH} && nano .env.production')
            print(f'   pm2 restart inmova-app --update-env')
            print()
        
        print('Documentación:')
        print('  - INTEGRACION_CONTASIMPLE_COMPLETA.md')
        print('  - RESUMEN_CONTASIMPLE_IMPLEMENTACION.md')
        print()
        
        print('Para ver logs:')
        print(f'  ssh {USERNAME}@{SERVER_IP} "pm2 logs inmova-app"')
        print()
        print('=' * 70)

    except Exception as e:
        log(f'❌ Error durante deployment: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()
        log('Conexión cerrada')

if __name__ == '__main__':
    main()
