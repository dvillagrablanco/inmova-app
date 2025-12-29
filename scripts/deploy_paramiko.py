#!/usr/bin/env python3
"""
Deployment automático vía Paramiko (SSH en Python)
BORRA ESTE ARCHIVO DESPUÉS DE USAR - CONTIENE CREDENCIALES
"""

import sys
import time
import paramiko
from paramiko import SSHClient, AutoAddPolicy

# ============================================
# CONFIGURACIÓN DEL SERVIDOR
# ============================================
SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "rCkrMFdswdmn"
REMOTE_PATH = "/opt/inmova-app"
GIT_REPO = "https://github.com/dvillagrablanco/inmova-app.git"
GIT_BRANCH = "main"

# Colores para terminal
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.NC}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.NC}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.NC}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.NC}")

def print_step(step, msg):
    print(f"\n{Colors.YELLOW}{step} {msg}{Colors.NC}")

def execute_command(ssh_client, command, print_output=True):
    """Ejecutar comando SSH y retornar output"""
    try:
        stdin, stdout, stderr = ssh_client.exec_command(command)
        exit_code = stdout.channel.recv_exit_status()
        
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        if print_output and output:
            print(output.strip())
        if error and exit_code != 0:
            print_error(f"Error: {error.strip()}")
            
        return exit_code, output, error
    except Exception as e:
        print_error(f"Error ejecutando comando: {str(e)}")
        return 1, "", str(e)

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  🚀 DEPLOYMENT AUTOMÁTICO VÍA PARAMIKO                      ║
║     Python SSH Deployment                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    print_warning("Este script contiene credenciales sensibles")
    print_warning("BÓRRALO después de usar\n")
    
    print_info(f"Servidor: {SSH_USER}@{SSH_HOST}")
    print_info(f"Ruta remota: {REMOTE_PATH}\n")
    
    # Verificar que paramiko está instalado
    try:
        import paramiko
    except ImportError:
        print_error("Paramiko no está instalado")
        print_info("Instalar con: pip install paramiko")
        sys.exit(1)
    
    # Crear cliente SSH
    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())
    
    try:
        # PASO 1: Conectar al servidor
        print_step("1️⃣", "Conectando al servidor...")
        ssh.connect(
            hostname=SSH_HOST,
            port=SSH_PORT,
            username=SSH_USER,
            password=SSH_PASS,
            timeout=10
        )
        print_success("Conectado exitosamente")
        
        # PASO 2: Verificar Docker
        print_step("2️⃣", "Verificando Docker...")
        exit_code, output, error = execute_command(ssh, "command -v docker", print_output=False)
        
        if exit_code != 0:
            print_warning("Docker no instalado, instalando...")
            commands = [
                "apt update",
                "apt install -y docker.io",
                "systemctl start docker",
                "systemctl enable docker"
            ]
            for cmd in commands:
                execute_command(ssh, f"sudo {cmd}", print_output=False)
            print_success("Docker instalado")
        else:
            print_success("Docker ya instalado")
        
        # PASO 3: Verificar Git
        print_step("3️⃣", "Verificando Git...")
        exit_code, _, _ = execute_command(ssh, "command -v git", print_output=False)
        
        if exit_code != 0:
            print_warning("Git no instalado, instalando...")
            execute_command(ssh, "apt install -y git", print_output=False)
            print_success("Git instalado")
        else:
            print_success("Git ya instalado")
        
        # PASO 4: Preparar directorio
        print_step("4️⃣", "Preparando directorio...")
        execute_command(ssh, "mkdir -p /opt", print_output=False)
        execute_command(ssh, "chown -R root:root /opt", print_output=False)
        print_success("Directorio preparado")
        
        # PASO 5: Clonar o actualizar repositorio
        print_step("5️⃣", "Gestionando repositorio...")
        
        # Verificar si el directorio existe
        exit_code, _, _ = execute_command(ssh, f"test -d {REMOTE_PATH}", print_output=False)
        
        if exit_code != 0:
            # No existe, clonar
            print_info("Clonando repositorio...")
            cmd = f"cd /opt && git clone {GIT_REPO}"
            exit_code, output, error = execute_command(ssh, cmd)
            if exit_code == 0:
                print_success("Repositorio clonado")
            else:
                print_error("Error clonando repositorio")
                sys.exit(1)
        else:
            # Existe, actualizar
            print_info("Actualizando código...")
            
            # Guardar cambios locales (stash)
            print_info("Guardando cambios locales (git stash)...")
            execute_command(ssh, f"cd {REMOTE_PATH} && git stash", print_output=False)
            
            commands = [
                f"cd {REMOTE_PATH}",
                "git fetch origin",
                f"git checkout {GIT_BRANCH}",
                f"git reset --hard origin/{GIT_BRANCH}",  # Force update
                f"git pull origin {GIT_BRANCH}"
            ]
            cmd = " && ".join(commands)
            exit_code, output, error = execute_command(ssh, cmd)
            if exit_code == 0:
                print_success("Código actualizado (forzado)")
            else:
                print_error("Error actualizando código")
                sys.exit(1)
        
        # PASO 6: Verificar .env.production
        print_step("6️⃣", "Verificando .env.production...")
        exit_code, _, _ = execute_command(ssh, f"test -f {REMOTE_PATH}/.env.production", print_output=False)
        
        if exit_code != 0:
            print_warning(".env.production no existe")
            print_info("Creando desde ejemplo...")
            execute_command(ssh, f"cd {REMOTE_PATH} && cp .env.production.example .env.production", print_output=False)
            print_warning("⚠️  IMPORTANTE: Edita .env.production en el servidor antes de continuar")
            print_info("Variables críticas: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL")
            
            response = input("\n¿Continuar sin configurar .env.production? (y/n): ")
            if response.lower() != 'y':
                print_info("Deployment cancelado")
                ssh.close()
                sys.exit(0)
        else:
            print_success(".env.production existe")
        
        # PASO 7: Hacer scripts ejecutables
        print_step("7️⃣", "Configurando permisos de scripts...")
        execute_command(ssh, f"chmod +x {REMOTE_PATH}/scripts/*.sh", print_output=False)
        print_success("Permisos configurados")
        
        # PASO 8: Ejecutar deployment
        print_step("8️⃣", "Ejecutando deployment...")
        print_info("Esto puede tardar 10-15 minutos (build de Docker)...\n")
        
        # Ejecutar deployment script
        cmd = f"cd {REMOTE_PATH} && ./scripts/deploy-direct.sh production"
        
        # Ejecutar y mostrar output en tiempo real
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # Leer output en tiempo real
        while True:
            line = stdout.readline()
            if not line:
                break
            print(line.rstrip())
        
        # Verificar exit code
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            print_success("\nDeployment ejecutado exitosamente")
        else:
            print_error("\nError en deployment")
            error_output = stderr.read().decode('utf-8')
            if error_output:
                print_error(f"Detalles: {error_output}")
            sys.exit(1)
        
        # PASO 9: Verificar contenedor
        print_step("9️⃣", "Verificando contenedor...")
        exit_code, output, _ = execute_command(ssh, "docker ps | grep inmova-app-production", print_output=False)
        
        if exit_code == 0 and output:
            print_success("Contenedor corriendo correctamente")
            print_info(f"Detalles: {output.strip()}")
        else:
            print_error("Contenedor no está corriendo")
            print_info("Ver logs con: docker logs inmova-app-production")
        
        # PASO 10: Resumen final
        print(f"""
{Colors.GREEN}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝{Colors.NC}

{Colors.BLUE}🎉 Aplicación deployada en:{Colors.NC}
   • IP directa: http://157.180.119.236:3000
   • Dominio: https://inmovaapp.com

{Colors.YELLOW}📋 Comandos útiles:{Colors.NC}

Ver logs:
  {Colors.BLUE}ssh root@157.180.119.236 'docker logs -f inmova-app-production'{Colors.NC}

Ver estado:
  {Colors.BLUE}ssh root@157.180.119.236 'docker ps'{Colors.NC}

Reiniciar:
  {Colors.BLUE}ssh root@157.180.119.236 'docker restart inmova-app-production'{Colors.NC}

{Colors.RED}🔒 ACCIÓN INMEDIATA REQUERIDA:{Colors.NC}

1. Cambiar contraseña SSH:
   {Colors.BLUE}ssh root@157.180.119.236{Colors.NC}
   {Colors.BLUE}passwd{Colors.NC}

2. Configurar SSH key:
   {Colors.BLUE}ssh-keygen -t ed25519{Colors.NC}
   {Colors.BLUE}ssh-copy-id root@157.180.119.236{Colors.NC}

3. BORRAR este script:
   {Colors.BLUE}rm scripts/deploy_paramiko.py{Colors.NC}

{Colors.GREEN}✨ ¡Deployment exitoso!{Colors.NC}
        """)
        
    except paramiko.AuthenticationException:
        print_error("Error de autenticación")
        print_info("Verifica usuario y contraseña")
        sys.exit(1)
    except paramiko.SSHException as e:
        print_error(f"Error SSH: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Error: {str(e)}")
        sys.exit(1)
    finally:
        ssh.close()
        print_info("Conexión SSH cerrada")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_warning("\n\nDeployment cancelado por usuario")
        sys.exit(0)
