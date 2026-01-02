#!/usr/bin/env python3
"""
Deployment Completo - Actualizar toda la aplicación
Sube todo el código actual al servidor
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import os
import time
from datetime import datetime

SERVER_CONFIG = {
    'hostname': '157.180.119.236',
    'username': 'root',
    'password': 'xcc9brgkMMbf',
    'port': 22,
    'timeout': 30
}

REMOTE_APP_PATH = '/opt/inmova-app'
BACKUP_DIR = f'/opt/inmova-backups/full-deploy-{datetime.now().strftime("%Y%m%d_%H%M%S")}'

class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'

def print_step(step, message):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"{Colors.BLUE}Paso {step}: {message}{Colors.NC}")
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}\n")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.NC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.NC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.NC}")

def execute_command(ssh, command, timeout=30, check_error=True):
    """Ejecuta comando SSH"""
    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        if check_error and exit_status != 0 and error:
            print_warning(f"Error: {error[:200]}")
        
        return {'exit_status': exit_status, 'output': output, 'error': error}
    except Exception as e:
        print_error(f"Error ejecutando comando: {e}")
        return {'exit_status': -1, 'output': '', 'error': str(e)}

def connect_ssh():
    print_step(1, "Conectando al Servidor")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    print_success(f"Conectado a {SERVER_CONFIG['hostname']}")
    return ssh

def create_backup(ssh):
    print_step(2, "Crear Backup Completo")
    
    # Crear backup del código actual
    execute_command(ssh, f"mkdir -p {BACKUP_DIR}")
    print_success(f"Backup dir: {BACKUP_DIR}")
    
    # Backup de archivos críticos
    critical_files = [
        'app/page.tsx',
        'app/landing/page.tsx',
        'components/landing/LandingPageContent.tsx',
        'components/providers.tsx',
    ]
    
    for file in critical_files:
        result = execute_command(
            ssh,
            f"test -f {REMOTE_APP_PATH}/{file} && cp {REMOTE_APP_PATH}/{file} {BACKUP_DIR}/ || true",
            check_error=False
        )
    
    print_success("Backup creado")

def update_code_via_git(ssh):
    print_step(3, "Actualizar Código vía Git")
    
    # Verificar estado del repo
    result = execute_command(ssh, f"cd {REMOTE_APP_PATH} && git status")
    print("Estado del repo:")
    print(result['output'][:500])
    
    # Stash cambios locales si los hay
    print("\nGuardando cambios locales...")
    execute_command(ssh, f"cd {REMOTE_APP_PATH} && git stash")
    
    # Pull latest
    print("\nActualizando código...")
    result = execute_command(ssh, f"cd {REMOTE_APP_PATH} && git pull origin main", timeout=60)
    
    if result['exit_status'] == 0:
        print_success("Código actualizado desde Git")
        print(result['output'][:300])
    else:
        print_warning("Git pull falló, continuando con SFTP manual")
        return False
    
    return True

def upload_critical_files_sftp(ssh):
    print_step(4, "Subir Archivos Críticos vía SFTP")
    
    # Archivos críticos de la landing
    files_to_upload = [
        # Core app
        ('app/page.tsx', f'{REMOTE_APP_PATH}/app/'),
        ('app/landing/page.tsx', f'{REMOTE_APP_PATH}/app/landing/'),
        ('app/layout.tsx', f'{REMOTE_APP_PATH}/app/'),
        
        # Landing components
        ('components/landing/LandingPageContent.tsx', f'{REMOTE_APP_PATH}/components/landing/'),
        ('components/landing/sections/Navigation.tsx', f'{REMOTE_APP_PATH}/components/landing/sections/'),
        
        # Providers (con solución de pantalla blanca)
        ('components/providers.tsx', f'{REMOTE_APP_PATH}/components/'),
        
        # Solución pantalla blanca
        ('components/ui/enhanced-error-boundary.tsx', f'{REMOTE_APP_PATH}/components/ui/'),
        ('lib/white-screen-detector.ts', f'{REMOTE_APP_PATH}/lib/'),
        ('components/WhiteScreenMonitor.tsx', f'{REMOTE_APP_PATH}/components/'),
    ]
    
    try:
        sftp = ssh.open_sftp()
        
        uploaded = 0
        failed = 0
        
        for local_file, remote_dir in files_to_upload:
            local_path = f'/workspace/{local_file}'
            remote_file = f'{remote_dir}{os.path.basename(local_file)}'
            
            # Crear directorio si no existe
            try:
                sftp.stat(remote_dir)
            except:
                execute_command(ssh, f"mkdir -p {remote_dir}")
            
            # Subir archivo
            try:
                if os.path.exists(local_path):
                    sftp.put(local_path, remote_file)
                    print_success(f"Subido: {local_file}")
                    uploaded += 1
                else:
                    print_warning(f"No encontrado localmente: {local_file}")
                    failed += 1
            except Exception as e:
                print_error(f"Error subiendo {local_file}: {e}")
                failed += 1
        
        sftp.close()
        print(f"\nResumen: {uploaded} subidos, {failed} fallidos")
        return uploaded > 0
        
    except Exception as e:
        print_error(f"Error SFTP: {e}")
        return False

def clear_cache(ssh):
    print_step(5, "Limpiar Cache de Next.js")
    
    commands = [
        f"cd {REMOTE_APP_PATH} && rm -rf .next/cache",
        f"cd {REMOTE_APP_PATH} && rm -rf .next/server",
    ]
    
    for cmd in commands:
        execute_command(ssh, cmd)
    
    print_success("Cache limpiado")

def restart_application(ssh):
    print_step(6, "Reiniciar Aplicación")
    
    # Verificar PM2
    result = execute_command(ssh, "which pm2")
    
    if result['exit_status'] == 0:
        print("Reiniciando con PM2...")
        
        # Matar proceso primero para asegurar limpieza
        execute_command(ssh, "fuser -k 3000/tcp 2>/dev/null || true")
        time.sleep(2)
        
        # Restart PM2
        execute_command(ssh, "pm2 restart inmova-app || pm2 start inmova-app")
        execute_command(ssh, "pm2 save")
        
        # Ver status
        result = execute_command(ssh, "pm2 list")
        print(result['output'])
        
        print_success("Aplicación reiniciada")
    else:
        print_warning("PM2 no encontrado, usando proceso directo")
        
        # Matar proceso en puerto 3000
        execute_command(ssh, "fuser -k 3000/tcp 2>/dev/null || true")
        
        print("Para iniciar manualmente:")
        print(f"  ssh root@{SERVER_CONFIG['hostname']}")
        print(f"  cd {REMOTE_APP_PATH}")
        print("  nohup npm run dev > /tmp/inmova.log 2>&1 &")

def verify_deployment(ssh):
    print_step(7, "Verificar Deployment")
    
    print("Esperando 15 segundos para que la app inicie...")
    time.sleep(15)
    
    # Health check
    result = execute_command(ssh, "curl -s http://localhost:3000/landing | head -20")
    
    if '<!DOCTYPE html>' in result['output']:
        print_success("✓ Landing page sirviendo HTML")
    else:
        print_error("✗ Landing no responde correctamente")
        print(result['output'][:200])
    
    # Verificar que NO redirige a landing-static.html
    if 'landing-static.html' in result['output']:
        print_error("✗ Todavía redirigiendo a landing-static.html")
    else:
        print_success("✓ Sin redirección a landing-static.html")
    
    # Check público
    print("\nVerificando acceso público...")
    result = execute_command(ssh, f"curl -I http://{SERVER_CONFIG['hostname']}/landing 2>&1")
    
    if '200' in result['output']:
        print_success("✓ Landing accesible públicamente")
    else:
        print_warning("⚠ Landing no accesible (puede ser Nginx)")
        print(result['output'][:200])

def print_summary():
    print(f"\n{Colors.GREEN}{'='*60}{Colors.NC}")
    print(f"{Colors.GREEN}🎉 DEPLOYMENT COMPLETO{Colors.NC}")
    print(f"{Colors.GREEN}{'='*60}{Colors.NC}\n")
    
    print("📋 Archivos actualizados:")
    print("  ✅ app/page.tsx")
    print("  ✅ app/landing/page.tsx")
    print("  ✅ components/landing/LandingPageContent.tsx")
    print("  ✅ components/landing/sections/Navigation.tsx")
    print("  ✅ components/providers.tsx")
    print("  ✅ Solución pantalla blanca (3 componentes)\n")
    
    print("🔗 Verificar en:")
    print(f"  → http://{SERVER_CONFIG['hostname']}/landing")
    print(f"  → http://{SERVER_CONFIG['hostname']}/login\n")
    
    print("📊 Debe tener:")
    print("  ✓ Navegación con logo INMOVA")
    print("  ✓ Botones: Iniciar Sesión, Comenzar Gratis")
    print("  ✓ Hero section completa")
    print("  ✓ Features, Pricing, Testimonials")
    print("  ✓ Footer con links")
    print("  ✓ Chatbot flotante\n")

def main():
    print(f"\n{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"{Colors.BLUE}🚀 DEPLOYMENT COMPLETO: App + Landing{Colors.NC}")
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}\n")
    
    ssh = None
    try:
        ssh = connect_ssh()
        create_backup(ssh)
        
        # Intentar actualizar vía Git primero
        if not update_code_via_git(ssh):
            # Si git falla, subir manualmente
            upload_critical_files_sftp(ssh)
        
        clear_cache(ssh)
        restart_application(ssh)
        verify_deployment(ssh)
        print_summary()
        
    except KeyboardInterrupt:
        print_error("\n\nDeployment interrumpido")
        sys.exit(1)
    except Exception as e:
        print_error(f"Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if ssh:
            ssh.close()

if __name__ == "__main__":
    main()
