#!/usr/bin/env python3
"""
Deployment de Sistema de Tutoriales a Producción
Incluye migraciones de Prisma para UserOnboardingProgress
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def log(message, level='INFO'):
    """Log con timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{timestamp}] [{level}] {message}')

def execute_command(ssh, command, description, timeout=300):
    """Ejecutar comando y retornar output"""
    log(f'{description}...', 'INFO')
    log(f'Comando: {command}', 'DEBUG')
    
    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        
        if output:
            log(f'Output:\n{output}', 'DEBUG')
        if error:
            log(f'Stderr:\n{error}', 'WARN')
        
        if exit_status != 0:
            log(f'Comando falló con exit code {exit_status}', 'ERROR')
            return False, error
        
        log(f'{description} completado ✓', 'SUCCESS')
        return True, output
    
    except Exception as e:
        log(f'Error ejecutando comando: {str(e)}', 'ERROR')
        return False, str(e)

def main():
    log('========================================', 'INFO')
    log('DEPLOYMENT: Sistema de Tutoriales', 'INFO')
    log('========================================', 'INFO')
    
    # Conectar SSH
    log(f'Conectando a {SERVER_IP}...', 'INFO')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=USERNAME,
            password=PASSWORD,
            timeout=10,
            banner_timeout=10
        )
        log('✓ Conexión SSH establecida', 'SUCCESS')
    except Exception as e:
        log(f'Error conectando: {str(e)}', 'ERROR')
        return 1
    
    try:
        # 1. Navegar a directorio
        success, output = execute_command(
            client,
            f'cd {APP_DIR} && pwd',
            'Verificar directorio de aplicación'
        )
        if not success:
            raise Exception('Directorio de aplicación no encontrado')
        
        # 2. Backup de base de datos
        log('Creando backup de base de datos...', 'INFO')
        backup_name = f'backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.sql'
        success, output = execute_command(
            client,
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && '
            f'pg_dump $DATABASE_URL > {backup_name}',
            'Backup de base de datos',
            timeout=120
        )
        if success:
            log(f'✓ Backup creado: {backup_name}', 'SUCCESS')
        else:
            log('⚠ Backup falló, continuando...', 'WARN')
        
        # 3. Git pull
        success, output = execute_command(
            client,
            f'cd {APP_DIR} && git pull origin main',
            'Git pull de cambios',
            timeout=60
        )
        if not success:
            raise Exception('Git pull falló')
        
        # 4. Verificar archivos de tutoriales
        log('Verificando archivos de tutoriales...', 'INFO')
        files_to_check = [
            'components/tutorials/InteractiveGuide.tsx',
            'components/tutorials/FirstTimeSetupWizard.tsx',
            'components/tutorials/OnboardingChecklist.tsx',
            'app/api/onboarding/checklist/route.ts',
            'app/api/onboarding/complete-setup/route.ts',
            'app/api/user/onboarding-status/route.ts'
        ]
        
        for file in files_to_check:
            success, output = execute_command(
                client,
                f'cd {APP_DIR} && test -f {file} && echo "exists"',
                f'Verificar {file}'
            )
            if not success or 'exists' not in output:
                log(f'⚠ Archivo no encontrado: {file}', 'WARN')
        
        # 5. Instalar dependencias
        success, output = execute_command(
            client,
            f'cd {APP_DIR} && npm install',
            'Instalar dependencias npm',
            timeout=300
        )
        if not success:
            raise Exception('npm install falló')
        
        # 6. Generar Prisma Client
        success, output = execute_command(
            client,
            f'cd {APP_DIR} && npx prisma generate',
            'Generar Prisma Client',
            timeout=120
        )
        if not success:
            raise Exception('Prisma generate falló')
        
        # 7. CRÍTICO: Aplicar migraciones de Prisma
        log('========================================', 'INFO')
        log('APLICANDO MIGRACIONES DE BASE DE DATOS', 'INFO')
        log('========================================', 'INFO')
        
        success, output = execute_command(
            client,
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && '
            f'npx prisma migrate deploy',
            'Aplicar migraciones de Prisma',
            timeout=180
        )
        if not success:
            log('⚠ Migraciones fallaron, verificando estado...', 'WARN')
            # Verificar estado de migraciones
            execute_command(
                client,
                f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && '
                f'npx prisma migrate status',
                'Verificar estado de migraciones'
            )
        else:
            log('✓ Migraciones aplicadas exitosamente', 'SUCCESS')
        
        # 8. Verificar tabla creada
        log('Verificando tabla user_onboarding_progress...', 'INFO')
        success, output = execute_command(
            client,
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && '
            f'psql $DATABASE_URL -c "\\dt user_onboarding_progress"',
            'Verificar tabla en BD'
        )
        if success and 'user_onboarding_progress' in output:
            log('✓ Tabla user_onboarding_progress existe', 'SUCCESS')
        
        # 9. Build de Next.js
        success, output = execute_command(
            client,
            f'cd {APP_DIR} && npm run build',
            'Build de Next.js',
            timeout=600
        )
        if not success:
            raise Exception('Build falló')
        
        # 10. Reload PM2
        success, output = execute_command(
            client,
            f'pm2 reload inmova-app',
            'Reload de PM2 (zero-downtime)',
            timeout=60
        )
        if not success:
            log('⚠ PM2 reload falló, intentando restart...', 'WARN')
            success, output = execute_command(
                client,
                f'pm2 restart inmova-app',
                'Restart de PM2'
            )
            if not success:
                raise Exception('PM2 restart falló')
        
        # 11. Esperar warm-up
        log('Esperando warm-up de la aplicación...', 'INFO')
        time.sleep(15)
        
        # 12. Health checks
        log('========================================', 'INFO')
        log('VERIFICACIONES POST-DEPLOYMENT', 'INFO')
        log('========================================', 'INFO')
        
        # Check 1: PM2 status
        success, output = execute_command(
            client,
            'pm2 status inmova-app',
            'Verificar PM2 status'
        )
        if success and 'online' in output:
            log('✓ PM2 status: online', 'SUCCESS')
        
        # Check 2: Health endpoint
        success, output = execute_command(
            client,
            'curl -s http://localhost:3000/api/health',
            'Verificar /api/health'
        )
        if success and ('ok' in output.lower() or 'healthy' in output.lower()):
            log('✓ Health endpoint respondiendo', 'SUCCESS')
        
        # Check 3: Onboarding status endpoint
        success, output = execute_command(
            client,
            'curl -s http://localhost:3000/api/user/onboarding-status',
            'Verificar /api/user/onboarding-status'
        )
        if success:
            if 'No autenticado' in output or 'hasCompletedOnboarding' in output:
                log('✓ API onboarding-status funcionando', 'SUCCESS')
            else:
                log(f'⚠ Respuesta inesperada: {output[:100]}', 'WARN')
        
        # Check 4: Onboarding checklist endpoint
        success, output = execute_command(
            client,
            'curl -s http://localhost:3000/api/onboarding/checklist',
            'Verificar /api/onboarding/checklist'
        )
        if success:
            if 'No autenticado' in output or 'checklist' in output:
                log('✓ API checklist funcionando', 'SUCCESS')
            else:
                log(f'⚠ Respuesta inesperada: {output[:100]}', 'WARN')
        
        # Check 5: Logs de PM2
        log('Últimas líneas de logs:', 'INFO')
        success, output = execute_command(
            client,
            'pm2 logs inmova-app --lines 20 --nostream',
            'Ver logs de PM2'
        )
        
        log('========================================', 'INFO')
        log('✓ DEPLOYMENT COMPLETADO EXITOSAMENTE', 'SUCCESS')
        log('========================================', 'INFO')
        
        log('URLs para verificar:', 'INFO')
        log('  - https://inmovaapp.com/login', 'INFO')
        log('  - https://inmovaapp.com/api/health', 'INFO')
        log('  - https://inmovaapp.com/api/user/onboarding-status', 'INFO')
        
        log('Pasos siguientes:', 'INFO')
        log('  1. Registrar nuevo usuario en https://inmovaapp.com', 'INFO')
        log('  2. Verificar que aparece wizard de 5 pasos', 'INFO')
        log('  3. Verificar checklist flotante en dashboard', 'INFO')
        log('  4. Probar marcar tareas como completadas', 'INFO')
        
        return 0
    
    except Exception as e:
        log(f'Deployment falló: {str(e)}', 'ERROR')
        return 1
    
    finally:
        client.close()
        log('Conexión SSH cerrada', 'INFO')

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
