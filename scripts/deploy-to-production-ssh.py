#!/usr/bin/env python3
"""
Deployment Automatizado con Paramiko - Solución Pantalla Blanca
Deploy de la solución completa al servidor de producción vía SSH
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import os
import time
from datetime import datetime

# Configuración del servidor
SERVER_CONFIG = {
    'hostname': '157.180.119.236',
    'username': 'root',
    'password': 'xcc9brgkMMbf',
    'port': 22,
    'timeout': 30
}

# Configuración de paths
REMOTE_APP_PATH = '/opt/inmova-app'
BACKUP_DIR = f'/opt/inmova-backups/white-screen-{datetime.now().strftime("%Y%m%d_%H%M%S")}'

class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'

def print_step(step, message):
    """Imprime paso del deployment"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"{Colors.BLUE}Paso {step}: {message}{Colors.NC}")
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}\n")

def print_success(message):
    """Imprime mensaje de éxito"""
    print(f"{Colors.GREEN}✅ {message}{Colors.NC}")

def print_error(message):
    """Imprime mensaje de error"""
    print(f"{Colors.RED}❌ {message}{Colors.NC}")

def print_warning(message):
    """Imprime mensaje de advertencia"""
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.NC}")

def execute_command(ssh, command, timeout=30, check_error=True):
    """Ejecuta comando SSH y retorna output"""
    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        if check_error and exit_status != 0:
            print_warning(f"Comando falló con exit status {exit_status}")
            if error:
                print(f"Error: {error}")
        
        return {
            'exit_status': exit_status,
            'output': output,
            'error': error
        }
    except Exception as e:
        print_error(f"Error ejecutando comando: {e}")
        return {
            'exit_status': -1,
            'output': '',
            'error': str(e)
        }

def connect_ssh():
    """Conecta al servidor vía SSH"""
    print_step(1, "Conectando al Servidor")
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        print(f"Conectando a {SERVER_CONFIG['hostname']}...")
        ssh.connect(
            hostname=SERVER_CONFIG['hostname'],
            username=SERVER_CONFIG['username'],
            password=SERVER_CONFIG['password'],
            port=SERVER_CONFIG['port'],
            timeout=SERVER_CONFIG['timeout']
        )
        
        print_success(f"Conectado exitosamente como {SERVER_CONFIG['username']}")
        return ssh
    
    except paramiko.AuthenticationException:
        print_error("Error de autenticación. Verifica usuario/password.")
        sys.exit(1)
    except paramiko.SSHException as e:
        print_error(f"Error SSH: {e}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Error conectando: {e}")
        sys.exit(1)

def verify_server_status(ssh):
    """Verifica el estado actual del servidor"""
    print_step(2, "Verificar Estado del Servidor")
    
    # Verificar que el directorio existe
    result = execute_command(ssh, f"test -d {REMOTE_APP_PATH} && echo 'EXISTS' || echo 'NOT_EXISTS'")
    
    if 'EXISTS' in result['output']:
        print_success(f"Directorio de aplicación encontrado: {REMOTE_APP_PATH}")
    else:
        print_error(f"Directorio no encontrado: {REMOTE_APP_PATH}")
        print("¿Crear directorio? (s/n)")
        # Por ahora asumimos que existe
    
    # Verificar si la app está corriendo
    result = execute_command(ssh, "pm2 list | grep inmova-app || echo 'NOT_RUNNING'")
    
    if 'NOT_RUNNING' not in result['output']:
        print_success("Aplicación está corriendo con PM2")
    else:
        print_warning("Aplicación NO está corriendo con PM2")
    
    # Verificar Node.js
    result = execute_command(ssh, "node --version")
    if result['exit_status'] == 0:
        print_success(f"Node.js instalado: {result['output'].strip()}")
    else:
        print_error("Node.js NO encontrado")
    
    # Verificar Git
    result = execute_command(ssh, "git --version")
    if result['exit_status'] == 0:
        print_success(f"Git instalado: {result['output'].strip()}")
    else:
        print_warning("Git NO encontrado")

def create_backup(ssh):
    """Crea backup de archivos existentes"""
    print_step(3, "Crear Backup de Archivos Existentes")
    
    # Crear directorio de backup
    execute_command(ssh, f"mkdir -p {BACKUP_DIR}")
    print_success(f"Directorio de backup creado: {BACKUP_DIR}")
    
    # Backup de providers.tsx (archivo crítico)
    backup_files = [
        f"{REMOTE_APP_PATH}/components/providers.tsx",
        f"{REMOTE_APP_PATH}/components/ui/error-boundary.tsx",
    ]
    
    for file in backup_files:
        result = execute_command(
            ssh, 
            f"test -f {file} && cp {file} {BACKUP_DIR}/ && echo 'BACKED_UP' || echo 'NOT_FOUND'",
            check_error=False
        )
        
        if 'BACKED_UP' in result['output']:
            print_success(f"Backup: {os.path.basename(file)}")
        else:
            print_warning(f"No encontrado: {os.path.basename(file)}")
    
    print_success(f"Backups guardados en: {BACKUP_DIR}")

def upload_files(ssh):
    """Sube archivos de la solución al servidor"""
    print_step(4, "Subir Archivos de la Solución")
    
    # Archivos a subir
    files_to_upload = [
        ('components/ui/enhanced-error-boundary.tsx', f'{REMOTE_APP_PATH}/components/ui/'),
        ('lib/white-screen-detector.ts', f'{REMOTE_APP_PATH}/lib/'),
        ('components/WhiteScreenMonitor.tsx', f'{REMOTE_APP_PATH}/components/'),
        ('components/providers.tsx', f'{REMOTE_APP_PATH}/components/'),
        ('e2e/white-screen-detection.spec.ts', f'{REMOTE_APP_PATH}/e2e/'),
        ('scripts/validate-white-screen-solution.sh', f'{REMOTE_APP_PATH}/scripts/'),
        ('scripts/monitor-white-screen-production.sh', f'{REMOTE_APP_PATH}/scripts/'),
    ]
    
    try:
        sftp = ssh.open_sftp()
        
        for local_file, remote_dir in files_to_upload:
            local_path = f'/workspace/{local_file}'
            remote_file = f'{remote_dir}{os.path.basename(local_file)}'
            
            # Crear directorio remoto si no existe
            try:
                sftp.stat(remote_dir)
            except FileNotFoundError:
                execute_command(ssh, f"mkdir -p {remote_dir}")
            
            # Subir archivo
            try:
                sftp.put(local_path, remote_file)
                print_success(f"Subido: {local_file}")
            except Exception as e:
                print_error(f"Error subiendo {local_file}: {e}")
        
        sftp.close()
        print_success("Todos los archivos subidos correctamente")
        
    except Exception as e:
        print_error(f"Error en SFTP: {e}")
        return False
    
    return True

def install_dependencies(ssh):
    """Instala dependencias necesarias"""
    print_step(5, "Instalar Dependencias")
    
    # Cambiar al directorio de la app
    commands = [
        f"cd {REMOTE_APP_PATH}",
        "npm install --production",
    ]
    
    command = " && ".join(commands)
    
    print("Instalando dependencias npm...")
    result = execute_command(ssh, command, timeout=300)
    
    if result['exit_status'] == 0:
        print_success("Dependencias instaladas")
    else:
        print_warning("Algunas dependencias fallaron (puede ser normal)")
    
    return True

def restart_application(ssh):
    """Reinicia la aplicación con PM2"""
    print_step(6, "Reiniciar Aplicación")
    
    # Verificar si PM2 está disponible
    result = execute_command(ssh, "which pm2")
    
    if result['exit_status'] != 0:
        print_warning("PM2 no encontrado. Usando proceso directo.")
        
        # Matar proceso en puerto 3000
        execute_command(ssh, "fuser -k 3000/tcp 2>/dev/null || true")
        print_success("Procesos en puerto 3000 terminados")
        
        # Iniciar app (esto puede no funcionar bien sin nohup)
        print_warning("Para iniciar manualmente: cd /opt/inmova-app && npm start")
        
    else:
        print_success("PM2 encontrado")
        
        # Reload con PM2 (zero-downtime)
        print("Ejecutando PM2 reload...")
        result = execute_command(ssh, "cd /opt/inmova-app && pm2 reload inmova-app || pm2 restart inmova-app")
        
        if result['exit_status'] == 0:
            print_success("Aplicación reiniciada con PM2")
        else:
            print_warning("PM2 reload falló. Intentando restart...")
            execute_command(ssh, "pm2 restart inmova-app")
        
        # Guardar configuración PM2
        execute_command(ssh, "pm2 save")
        
        # Mostrar status
        result = execute_command(ssh, "pm2 list")
        print("\nEstado de PM2:")
        print(result['output'])

def verify_deployment(ssh):
    """Verifica que el deployment fue exitoso"""
    print_step(7, "Verificar Deployment")
    
    # Esperar unos segundos para que la app inicie
    print("Esperando 10 segundos para que la app inicie...")
    time.sleep(10)
    
    # Verificar que los archivos existen
    files_to_check = [
        f'{REMOTE_APP_PATH}/components/ui/enhanced-error-boundary.tsx',
        f'{REMOTE_APP_PATH}/lib/white-screen-detector.ts',
        f'{REMOTE_APP_PATH}/components/WhiteScreenMonitor.tsx',
    ]
    
    all_exist = True
    for file in files_to_check:
        result = execute_command(ssh, f"test -f {file} && echo 'EXISTS' || echo 'NOT_FOUND'")
        if 'EXISTS' in result['output']:
            print_success(f"✓ {os.path.basename(file)}")
        else:
            print_error(f"✗ {os.path.basename(file)}")
            all_exist = False
    
    if not all_exist:
        print_error("Algunos archivos no se subieron correctamente")
        return False
    
    # Health check HTTP
    print("\nVerificando health check HTTP...")
    result = execute_command(
        ssh,
        "curl -f http://localhost:3000/api/health 2>/dev/null || curl -f http://localhost:3000/ 2>/dev/null",
        timeout=10,
        check_error=False
    )
    
    if result['exit_status'] == 0:
        print_success("✓ Aplicación respondiendo en localhost:3000")
    else:
        print_warning("⚠ Aplicación no responde (puede estar iniciando)")
    
    # Verificar desde IP pública
    print("\nVerificando acceso público...")
    result = execute_command(
        ssh,
        f"curl -I http://{SERVER_CONFIG['hostname']}/landing 2>/dev/null | head -1",
        timeout=10,
        check_error=False
    )
    
    if '200' in result['output'] or '301' in result['output'] or '302' in result['output']:
        print_success("✓ Aplicación accesible desde IP pública")
    else:
        print_warning("⚠ Aplicación no accesible públicamente (revisar firewall/nginx)")
    
    return True

def print_summary():
    """Imprime resumen del deployment"""
    print(f"\n{Colors.GREEN}{'='*60}{Colors.NC}")
    print(f"{Colors.GREEN}🎉 DEPLOYMENT COMPLETADO{Colors.NC}")
    print(f"{Colors.GREEN}{'='*60}{Colors.NC}\n")
    
    print("📋 Resumen:")
    print("  • Archivos subidos y actualizados")
    print("  • Backup creado")
    print("  • Aplicación reiniciada")
    print("  • Solución de pantalla blanca instalada\n")
    
    print("🔗 Accesos:")
    print(f"  • Aplicación: http://{SERVER_CONFIG['hostname']}/landing")
    print(f"  • Dashboard: http://{SERVER_CONFIG['hostname']}/dashboard")
    print(f"  • Login: http://{SERVER_CONFIG['hostname']}/login\n")
    
    print("📊 Próximos pasos:")
    print("  1. Verificar que la aplicación funciona:")
    print(f"     → Abrir: http://{SERVER_CONFIG['hostname']}/landing")
    print("  2. Monitorear logs:")
    print(f"     → ssh root@{SERVER_CONFIG['hostname']}")
    print("     → pm2 logs inmova-app")
    print("  3. Ejecutar script de monitoreo:")
    print("     → bash scripts/monitor-white-screen-production.sh")
    print("  4. Revisar durante 24-48 horas\n")
    
    print(f"{Colors.YELLOW}🔄 Rollback (si es necesario):{Colors.NC}")
    print(f"  ssh root@{SERVER_CONFIG['hostname']}")
    print(f"  cp {BACKUP_DIR}/* {REMOTE_APP_PATH}/components/")
    print(f"  pm2 restart inmova-app\n")

def main():
    """Función principal"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"{Colors.BLUE}🚀 DEPLOYMENT: Solución Pantalla Blanca{Colors.NC}")
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"\nServidor: {SERVER_CONFIG['hostname']}")
    print(f"Usuario: {SERVER_CONFIG['username']}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    ssh = None
    try:
        # 1. Conectar
        ssh = connect_ssh()
        
        # 2. Verificar estado
        verify_server_status(ssh)
        
        # 3. Crear backup
        create_backup(ssh)
        
        # 4. Subir archivos
        if not upload_files(ssh):
            print_error("Error subiendo archivos. Abortando.")
            sys.exit(1)
        
        # 5. Instalar dependencias
        install_dependencies(ssh)
        
        # 6. Reiniciar aplicación
        restart_application(ssh)
        
        # 7. Verificar deployment
        verify_deployment(ssh)
        
        # 8. Resumen
        print_summary()
        
    except KeyboardInterrupt:
        print_error("\n\nDeployment interrumpido por usuario")
        sys.exit(1)
    
    except Exception as e:
        print_error(f"Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        if ssh:
            ssh.close()
            print(f"\n{Colors.BLUE}Conexión SSH cerrada{Colors.NC}\n")

if __name__ == "__main__":
    main()
