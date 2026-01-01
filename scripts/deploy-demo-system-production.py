#!/usr/bin/env python3
"""
Deployment del sistema completo de demos a producción
Ejecutar: python3 scripts/deploy-demo-system-production.py
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time
from datetime import datetime

# Configuración del servidor
SERVER = {
    'host': '157.180.119.236',
    'port': 22,
    'username': 'root',
    'password': 'xcc9brgkMMbf'
}

APP_DIR = '/opt/inmova-app'

def log(message, type='info'):
    """Logger con timestamp"""
    timestamp = datetime.now().strftime('%H:%M:%S')
    prefix = {
        'info': '📘',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌',
        'step': '🔷'
    }.get(type, 'ℹ️')
    
    print(f"[{timestamp}] {prefix} {message}")

def execute_command(ssh, command, description, timeout=300):
    """Ejecutar comando en el servidor"""
    log(description, 'step')
    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        
        if exit_code != 0:
            log(f"Comando falló con exit code {exit_code}", 'error')
            if error:
                log(f"Error: {error[:500]}", 'error')
            return False, output, error
        
        if output:
            print(output[:1000])  # Primeras 1000 chars
        
        return True, output, error
        
    except Exception as e:
        log(f"Error ejecutando comando: {str(e)}", 'error')
        return False, '', str(e)

def deploy_demo_system():
    """Deployment completo del sistema de demos"""
    log('🎭 DEPLOYMENT DEL SISTEMA DE EMPRESAS DEMO', 'step')
    log('=' * 60)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Conectar al servidor
        log(f"Conectando a {SERVER['host']}...", 'step')
        ssh.connect(
            SERVER['host'],
            port=SERVER['port'],
            username=SERVER['username'],
            password=SERVER['password'],
            timeout=10
        )
        log('Conectado exitosamente', 'success')
        
        # 1. Git pull
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && git pull origin main',
            '1. Actualizando código desde repositorio...'
        )
        if not success:
            log('Error en git pull - continuando con archivos locales', 'warning')
        
        # 2. NPM install
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && npm install',
            '2. Instalando dependencias...',
            timeout=600
        )
        if not success:
            log('Error instalando dependencias', 'error')
            return False
        
        # 3. Prisma generate
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && npx prisma generate',
            '3. Generando Prisma Client...'
        )
        if not success:
            log('Error generando Prisma Client', 'error')
            return False
        
        # 4. Ejecutar scripts de demo
        log('4. Ejecutando scripts de setup demo...', 'step')
        
        # 4.1 Seed de planes (incluye Demo)
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && npx tsx scripts/seed-subscription-plans.ts',
            '4.1. Creando planes de suscripción...',
            timeout=120
        )
        if not success:
            log('Error en seed de planes', 'error')
            return False
        log('Planes actualizados', 'success')
        
        # 4.2 Migrar empresas existentes
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && npx tsx scripts/migrate-companies-to-plans.ts',
            '4.2. Asignando planes a empresas existentes...',
            timeout=120
        )
        if not success:
            log('Error migrando empresas', 'warning')
        else:
            log('Empresas migradas', 'success')
        
        # 4.3 Limpiar demos antiguos
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && npx tsx scripts/cleanup-demo-companies.ts',
            '4.3. Limpiando empresas demo antiguas...',
            timeout=120
        )
        if not success:
            log('No se encontraron demos antiguos o error en limpieza', 'warning')
        else:
            log('Limpieza completada', 'success')
        
        # 4.4 Crear empresas demo
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && npx tsx scripts/seed-demo-companies.ts',
            '4.4. Creando empresas demo con datos...',
            timeout=300
        )
        if not success:
            log('Error creando empresas demo', 'error')
            return False
        log('Empresas demo creadas exitosamente', 'success')
        
        # 5. Aplicar migración de schema (hacer plan obligatorio)
        log('5. Aplicando migración de schema...', 'step')
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && npx prisma migrate deploy',
            '5.1. Aplicando migraciones pendientes...',
            timeout=120
        )
        if not success:
            log('Error aplicando migraciones', 'warning')
        else:
            log('Migraciones aplicadas', 'success')
        
        # 6. Build de Next.js
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && npm run build',
            '6. Building Next.js...',
            timeout=600
        )
        if not success:
            log('Error en build', 'error')
            return False
        log('Build exitoso', 'success')
        
        # 7. Reload PM2
        success, output, error = execute_command(
            ssh,
            'pm2 reload inmova-app',
            '7. Reloading PM2...'
        )
        if not success:
            log('Error reloading PM2', 'error')
            return False
        log('PM2 reloaded', 'success')
        
        # 8. Esperar warm-up
        log('8. Esperando warm-up de la aplicación...', 'step')
        time.sleep(15)
        
        # 9. Health check
        success, output, error = execute_command(
            ssh,
            'curl -f http://localhost:3000/api/health',
            '9. Health check...'
        )
        if not success:
            log('Health check falló', 'warning')
        else:
            log('Health check OK', 'success')
        
        # 10. Verificar empresas demo en BD
        log('10. Verificando empresas demo en BD...', 'step')
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && psql $DATABASE_URL -c "SELECT nombre, email FROM \\"Company\\" WHERE email LIKE \'%@demo.inmova.app%\' ORDER BY nombre;"',
            '10.1. Consultando empresas demo...',
            timeout=30
        )
        if success and output:
            log('Empresas demo verificadas:', 'success')
            print(output)
        
        # Resumen final
        log('=' * 60, 'step')
        log('✅ DEPLOYMENT COMPLETADO EXITOSAMENTE', 'success')
        log('=' * 60, 'step')
        log('')
        log('📋 CREDENCIALES DE EMPRESAS DEMO:', 'step')
        log('')
        log('1. DEMO - Propietario Individual')
        log('   👤 juan.propietario@demo.inmova.app / Demo123456!')
        log('')
        log('2. DEMO - Gestor Profesional')
        log('   👤 maria.gestora@demo.inmova.app / Demo123456!')
        log('   👤 carlos.asistente@demo.inmova.app / Demo123456!')
        log('')
        log('3. DEMO - Coliving Company')
        log('   👤 ana.coliving@demo.inmova.app / Demo123456!')
        log('   👤 pedro.community@demo.inmova.app / Demo123456!')
        log('')
        log('4. DEMO - Alquiler Vacacional (STR)')
        log('   👤 luis.vacacional@demo.inmova.app / Demo123456!')
        log('')
        log('5. DEMO - Gestora Inmobiliaria Grande')
        log('   👤 roberto.director@demo.inmova.app / Demo123456!')
        log('   👤 laura.gestor@demo.inmova.app / Demo123456!')
        log('   👤 david.operador@demo.inmova.app / Demo123456!')
        log('')
        log('6. DEMO - Comunidad de Propietarios')
        log('   👤 carmen.admin@demo.inmova.app / Demo123456!')
        log('')
        log('🌐 URL: https://inmovaapp.com/login', 'step')
        log('')
        log('💡 Próximos pasos:', 'step')
        log('   1. Probar login con cada usuario demo')
        log('   2. Verificar datos cargados en cada empresa')
        log('   3. Documentar flujos de demo para equipo')
        log('')
        
        return True
        
    except paramiko.AuthenticationException:
        log('Error de autenticación SSH', 'error')
        return False
    except paramiko.SSHException as e:
        log(f'Error SSH: {str(e)}', 'error')
        return False
    except Exception as e:
        log(f'Error inesperado: {str(e)}', 'error')
        return False
    finally:
        ssh.close()
        log('Conexión SSH cerrada', 'info')

if __name__ == '__main__':
    try:
        success = deploy_demo_system()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        log('\n\nDeployment cancelado por usuario', 'warning')
        sys.exit(1)
    except Exception as e:
        log(f'Error fatal: {str(e)}', 'error')
        sys.exit(1)
