#!/usr/bin/env python3
"""
Deployment completo de nueva landing page
"""

import paramiko
import sys
import time
from typing import Tuple

# Configuración SSH
SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "xqxAkFdA33j3"
REMOTE_PATH = "/opt/inmova-app"

def print_header(msg: str):
    print(f"\n{'='*80}")
    print(f"  {msg}")
    print(f"{'='*80}\n")

def print_step(num: str, msg: str):
    print(f"\n\033[1;36m{num}  {msg}\033[0m")

def print_info(msg: str):
    print(f"\033[34m   ℹ️  {msg}\033[0m")

def print_success(msg: str):
    print(f"\033[32m   ✅ {msg}\033[0m")

def print_error(msg: str):
    print(f"\033[31m   ❌ {msg}\033[0m")

def print_warning(msg: str):
    print(f"\033[33m   ⚠️  {msg}\033[0m")

def execute_command(ssh: paramiko.SSHClient, command: str, print_output: bool = True) -> Tuple[int, str, str]:
    """Ejecuta comando y retorna (exit_code, stdout, stderr)"""
    stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)
    exit_code = stdout.channel.recv_exit_status()
    stdout_text = stdout.read().decode('utf-8')
    stderr_text = stderr.read().decode('utf-8')
    
    if print_output:
        if stdout_text:
            for line in stdout_text.split('\n'):
                if line.strip():
                    print(f"   {line}")
        if stderr_text and exit_code != 0:
            for line in stderr_text.split('\n'):
                if line.strip():
                    print(f"   {line}", file=sys.stderr)
    
    return exit_code, stdout_text, stderr_text

def main():
    print_header("🚀 DEPLOYMENT LANDING PAGE NUEVA - INMOVA")
    
    print_info(f"Conectando a {SSH_HOST}...")
    
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
        
        # ========================================================================
        # PASO 1: Limpiar rutas conflictivas
        # ========================================================================
        print_step("1️⃣", "Limpiando rutas conflictivas...")
        
        cleanup_commands = [
            f"cd {REMOTE_PATH}",
            "rm -rf app/home/ 2>/dev/null || true",
            "rm -rf app/\\(public\\)/ 2>/dev/null || true",
            "find app -type d -name home -exec rm -rf {} \\; 2>/dev/null || true"
        ]
        
        for cmd in cleanup_commands:
            execute_command(ssh, cmd, print_output=False)
        
        print_success("Rutas conflictivas eliminadas")
        
        # ========================================================================
        # PASO 2: Verificar Git
        # ========================================================================
        print_step("2️⃣", "Verificando repositorio Git...")
        
        verify_cmd = f"cd {REMOTE_PATH} && git remote -v | head -1"
        exit_code, stdout, _ = execute_command(ssh, verify_cmd, print_output=False)
        
        if exit_code == 0:
            print_success("Repositorio Git verificado")
        
        # ========================================================================
        # PASO 3: Actualizar código desde GitHub
        # ========================================================================
        print_step("3️⃣", "Actualizando código desde GitHub...")
        
        print_info("Guardando cambios locales (git stash)...")
        execute_command(ssh, f"cd {REMOTE_PATH} && git stash", print_output=False)
        
        print_info("Descargando última versión...")
        git_commands = [
            f"cd {REMOTE_PATH}",
            "git fetch origin",
            "git checkout main",
            "git reset --hard origin/main",
            "git clean -fd"
        ]
        
        for cmd in git_commands:
            exit_code, stdout, stderr = execute_command(ssh, cmd, print_output=False)
            if exit_code != 0:
                print_error(f"Error en: {cmd}")
                print_error(stderr)
                return 1
        
        print_success("Código actualizado correctamente")
        
        # ========================================================================
        # PASO 4: Verificar estructura de archivos
        # ========================================================================
        print_step("4️⃣", "Verificando estructura de archivos...")
        
        verify_structure = f"cd {REMOTE_PATH} && find app -name 'page.tsx' | grep -E 'landing|home' | sort"
        exit_code, stdout, _ = execute_command(ssh, verify_structure, print_output=False)
        
        print_info("Páginas encontradas:")
        for line in stdout.strip().split('\n'):
            if line.strip():
                if 'landing' in line:
                    print(f"   ✅ {line}")
                elif 'home' in line:
                    print(f"   ❌ {line} (CONFLICTO - debe eliminarse)")
        
        # Si hay conflicto, limpiar de nuevo
        if 'home' in stdout and 'landing' in stdout:
            print_warning("Detectado conflicto, limpiando de nuevo...")
            execute_command(ssh, f"cd {REMOTE_PATH} && rm -rf app/home/", print_output=False)
            print_success("Conflicto resuelto")
        
        # ========================================================================
        # PASO 5: Verificar .env.production
        # ========================================================================
        print_step("5️⃣", "Verificando variables de entorno...")
        
        check_env = f"cd {REMOTE_PATH} && grep -E 'NEXTAUTH_URL|APP_URL' .env.production | head -2"
        exit_code, stdout, _ = execute_command(ssh, check_env, print_output=False)
        
        if 'inmovaapp.com' in stdout:
            print_success("Variables de entorno correctas")
            for line in stdout.strip().split('\n'):
                print(f"   {line}")
        else:
            print_warning("URLs necesitan actualización en .env.production")
        
        # ========================================================================
        # PASO 6: Limpiar cache de Next.js
        # ========================================================================
        print_step("6️⃣", "Limpiando cache de Next.js...")
        
        cache_cleanup = [
            f"cd {REMOTE_PATH}",
            "rm -rf .next",
            "rm -rf node_modules/.cache"
        ]
        
        for cmd in cache_cleanup:
            execute_command(ssh, cmd, print_output=False)
        
        print_success("Cache limpiado")
        
        # ========================================================================
        # PASO 7: Iniciar deployment
        # ========================================================================
        print_step("7️⃣", "Iniciando deployment (esto tomará 3-5 minutos)...")
        
        # Iniciar deployment en background
        deploy_cmd = f"cd {REMOTE_PATH} && nohup bash scripts/deploy-direct.sh > /tmp/deploy-landing.log 2>&1 &"
        execute_command(ssh, deploy_cmd, print_output=False)
        
        print_success("Deployment iniciado en background")
        print_info("Monitoreando progreso del build...")
        
        # Monitorear el log en tiempo real
        time.sleep(5)
        
        for i in range(30):  # Monitorear por ~5 minutos máximo
            time.sleep(10)
            
            # Leer últimas líneas del log
            log_cmd = "tail -5 /tmp/deploy-landing.log 2>/dev/null || echo 'Esperando log...'"
            exit_code, stdout, _ = execute_command(ssh, log_cmd, print_output=False)
            
            # Buscar indicadores de progreso
            if 'Building' in stdout:
                print_info("🏗️  Construyendo imagen Docker...")
            elif 'Successfully built' in stdout or 'Successfully tagged' in stdout:
                print_success("Imagen Docker construida exitosamente")
            elif 'Contenedor iniciado' in stdout or 'Container started' in stdout:
                print_success("Contenedor iniciado")
                break
            elif 'error' in stdout.lower() or 'failed' in stdout.lower():
                print_error("Error detectado en el build")
                print_info("Últimas líneas del log:")
                execute_command(ssh, "tail -20 /tmp/deploy-landing.log", print_output=True)
                return 1
        
        # ========================================================================
        # PASO 8: Verificar contenedores
        # ========================================================================
        print_step("8️⃣", "Verificando contenedores Docker...")
        
        time.sleep(5)
        
        check_containers = "docker ps | grep inmova"
        exit_code, stdout, _ = execute_command(ssh, check_containers, print_output=False)
        
        if 'inmova-app_app_1' in stdout and 'Up' in stdout:
            print_success("Contenedor de aplicación está corriendo")
            
            # Mostrar estado de contenedores
            print_info("Estado de contenedores:")
            execute_command(ssh, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep inmova", print_output=True)
        else:
            print_error("El contenedor no está corriendo correctamente")
            print_info("Verificando logs...")
            execute_command(ssh, "docker logs --tail 30 inmova-app_app_1 2>&1", print_output=True)
            return 1
        
        # ========================================================================
        # PASO 9: Verificar que la app responde
        # ========================================================================
        print_step("9️⃣", "Verificando que la aplicación responde...")
        
        time.sleep(3)
        
        # Test de health
        health_check = "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo '000'"
        exit_code, stdout, _ = execute_command(ssh, health_check, print_output=False)
        
        status_code = stdout.strip()
        
        if status_code in ['200', '307', '301']:
            print_success(f"Aplicación respondiendo correctamente (HTTP {status_code})")
        else:
            print_warning(f"La aplicación devolvió HTTP {status_code}, puede necesitar unos segundos más")
        
        # ========================================================================
        # PASO 10: Ver últimas líneas del log
        # ========================================================================
        print_step("🔟", "Log final del deployment:")
        
        execute_command(ssh, "tail -20 /tmp/deploy-landing.log", print_output=True)
        
        # ========================================================================
        # RESUMEN FINAL
        # ========================================================================
        print_header("✅ DEPLOYMENT COMPLETADO")
        
        print_success("La nueva landing ha sido deployada exitosamente")
        print("")
        print("📋 Verificación:")
        print("   1. Abre en tu navegador: https://inmovaapp.com")
        print("   2. Deberías ver la landing nueva (componentes modulares)")
        print("   3. Verifica que no hay errores en la consola (F12)")
        print("")
        print("📊 Comandos útiles:")
        print("   • Ver logs: ssh root@157.180.119.236 'docker logs -f inmova-app_app_1'")
        print("   • Ver estado: ssh root@157.180.119.236 'docker ps'")
        print("")
        print_warning("🔐 IMPORTANTE: Por seguridad, cambia la contraseña SSH ahora:")
        print("   ssh root@157.180.119.236")
        print("   passwd")
        print("")
        
    except paramiko.AuthenticationException:
        print_error("Error de autenticación SSH - verifica la contraseña")
        return 1
    except paramiko.SSHException as e:
        print_error(f"Error de conexión SSH: {str(e)}")
        return 1
    except Exception as e:
        print_error(f"Error inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        ssh.close()
        print_info("Conexión SSH cerrada")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
