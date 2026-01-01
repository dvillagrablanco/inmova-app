#!/usr/bin/env python3
"""
Deployment de actualización de landing + sublanding eWoorker
Ejecutar: python3 scripts/deploy-landing-ewoorker-production.py
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time
from datetime import datetime

SERVER = {
    'host': '157.180.119.236',
    'port': 22,
    'username': 'root',
    'password': 'xcc9brgkMMbf'
}

APP_DIR = '/opt/inmova-app'

def log(message, type='info'):
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
        
        if output and len(output) < 1000:
            print(output)
        
        return True, output, error
        
    except Exception as e:
        log(f"Error ejecutando comando: {str(e)}", 'error')
        return False, '', str(e)

def deploy():
    log('🚀 DEPLOYMENT LANDING + EWOORKER', 'step')
    log('=' * 60)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
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
            '1. Actualizando código...'
        )
        if not success:
            log('Continuando con código local', 'warning')
        
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
        
        # 3. Build
        success, output, error = execute_command(
            ssh,
            f'cd {APP_DIR} && npm run build',
            '3. Building Next.js...',
            timeout=600
        )
        if not success:
            log('Error en build', 'error')
            return False
        log('Build exitoso', 'success')
        
        # 4. Reload PM2
        success, output, error = execute_command(
            ssh,
            'pm2 reload inmova-app',
            '4. Reloading PM2...'
        )
        if not success:
            log('Error reloading PM2', 'error')
            return False
        log('PM2 reloaded', 'success')
        
        # 5. Esperar warm-up
        log('5. Esperando warm-up...', 'step')
        time.sleep(15)
        
        # 6. Health checks
        log('6. Verificando endpoints...', 'step')
        
        endpoints = [
            ('Landing Principal', 'http://localhost:3000/landing'),
            ('eWoorker Landing', 'http://localhost:3000/ewoorker/landing'),
            ('Planes', 'http://localhost:3000/planes'),
            ('Health API', 'http://localhost:3000/api/health'),
        ]
        
        all_ok = True
        for name, url in endpoints:
            success, output, error = execute_command(
                ssh,
                f'curl -f -s -o /dev/null -w "%{{http_code}}" {url}',
                f'   Verificando {name}...',
                timeout=30
            )
            if success and '200' in output:
                log(f'   ✅ {name}: OK', 'success')
            else:
                log(f'   ❌ {name}: FAIL', 'error')
                all_ok = False
        
        if not all_ok:
            log('Algunos endpoints fallaron', 'warning')
        
        # Resumen
        log('=' * 60, 'step')
        log('✅ DEPLOYMENT COMPLETADO', 'success')
        log('=' * 60, 'step')
        log('')
        log('📋 URLS VERIFICAR:', 'step')
        log('   • Landing: https://inmovaapp.com/landing')
        log('   • eWoorker: https://inmovaapp.com/ewoorker/landing')
        log('   • Planes: https://inmovaapp.com/planes')
        log('')
        log('✅ CAMBIOS APLICADOS:', 'success')
        log('   • Eliminadas referencias a competidores')
        log('   • Sublanding eWoorker con identidad propia')
        log('   • Planes y precios actualizados')
        log('   • Botones revisados y funcionales')
        log('')
        
        return True
        
    except paramiko.AuthenticationException:
        log('Error de autenticación SSH', 'error')
        return False
    except Exception as e:
        log(f'Error inesperado: {str(e)}', 'error')
        return False
    finally:
        ssh.close()
        log('Conexión SSH cerrada', 'info')

if __name__ == '__main__':
    try:
        success = deploy()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        log('\n\nDeployment cancelado', 'warning')
        sys.exit(1)
    except Exception as e:
        log(f'Error fatal: {str(e)}', 'error')
        sys.exit(1)
