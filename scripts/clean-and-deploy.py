#!/usr/bin/env python3
"""
Script para limpiar rutas conflictivas en servidor y re-deployar
"""

import paramiko
import sys
from typing import Tuple

# Configuración SSH
SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "XVcL9qHxqA7f"
REMOTE_PATH = "/opt/inmova-app"

def print_info(msg: str):
    print(f"\033[34mℹ️  {msg}\033[0m")

def print_success(msg: str):
    print(f"\033[32m✅ {msg}\033[0m")

def print_error(msg: str):
    print(f"\033[31m❌ {msg}\033[0m")

def execute_command(ssh: paramiko.SSHClient, command: str, print_output: bool = True) -> Tuple[int, str, str]:
    """Ejecuta comando y retorna (exit_code, stdout, stderr)"""
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_code = stdout.channel.recv_exit_status()
    stdout_text = stdout.read().decode('utf-8')
    stderr_text = stderr.read().decode('utf-8')
    
    if print_output and stdout_text:
        print(stdout_text)
    if print_output and stderr_text:
        print(stderr_text, file=sys.stderr)
    
    return exit_code, stdout_text, stderr_text

def main():
    print_info("Conectando al servidor...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(
            hostname=SSH_HOST,
            port=SSH_PORT,
            username=SSH_USER,
            password=SSH_PASS,
            timeout=30
        )
        print_success("Conectado al servidor")
        
        # 1. Limpiar directorios conflictivos
        print_info("Limpiando rutas conflictivas...")
        
        cleanup_commands = [
            f"cd {REMOTE_PATH}",
            "rm -rf app/home/",
            "rm -rf app/\\(public\\)/home/",
            "rm -rf app/\\(public\\)/",
            "find app -name 'home' -type d -exec rm -rf {{}} \\; 2>/dev/null || true"
        ]
        
        cleanup_cmd = " && ".join(cleanup_commands)
        exit_code, _, _ = execute_command(ssh, cleanup_cmd, print_output=True)
        
        if exit_code == 0:
            print_success("Rutas conflictivas eliminadas")
        
        # 2. Git pull para sincronizar
        print_info("Sincronizando código con GitHub...")
        
        git_commands = [
            f"cd {REMOTE_PATH}",
            "git fetch origin",
            "git reset --hard origin/main",
            "git clean -fd"
        ]
        
        git_cmd = " && ".join(git_commands)
        exit_code, _, _ = execute_command(ssh, git_cmd, print_output=True)
        
        if exit_code == 0:
            print_success("Código sincronizado")
        
        # 3. Verificar estructura
        print_info("Verificando estructura de directorios...")
        
        verify_cmd = f"cd {REMOTE_PATH} && find app -name 'page.tsx' | grep -E 'landing|home' | sort"
        exit_code, stdout, _ = execute_command(ssh, verify_cmd, print_output=False)
        
        print("Páginas encontradas:")
        print(stdout)
        
        # 4. Ejecutar deployment
        print_info("Iniciando deployment...")
        
        deploy_cmd = f"cd {REMOTE_PATH} && bash scripts/deploy-direct.sh > /tmp/deploy.log 2>&1 &"
        execute_command(ssh, deploy_cmd, print_output=False)
        
        print_success("Deployment iniciado en background")
        print_info("Monitoreando log...")
        
        # Esperar un poco y mostrar primeras líneas
        import time
        time.sleep(5)
        
        log_cmd = "tail -20 /tmp/deploy.log"
        execute_command(ssh, log_cmd, print_output=True)
        
        print_info("✨ Deployment en progreso. Monitorea con: python3 scripts/monitor-deployment.py")
        
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return 1
    finally:
        ssh.close()
        print_info("Conexión SSH cerrada")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
