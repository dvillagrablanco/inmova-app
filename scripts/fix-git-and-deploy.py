#!/usr/bin/env python3
"""
Fix Git issues and deploy
"""

import paramiko
import sys
import time

SSH_HOST = "157.180.119.236"
SSH_PORT = 22
SSH_USER = "root"
SSH_PASS = "xqxAkFdA33j3"
REMOTE_PATH = "/opt/inmova-app"

def print_step(msg: str):
    print(f"\n\033[1;36m{msg}\033[0m")

def print_info(msg: str):
    print(f"\033[34m   {msg}\033[0m")

def print_success(msg: str):
    print(f"\033[32m   ✅ {msg}\033[0m")

def print_error(msg: str):
    print(f"\033[31m   ❌ {msg}\033[0m")

def execute(ssh, cmd, show_output=True):
    """Ejecuta comando y muestra output"""
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    exit_code = stdout.channel.recv_exit_status()
    
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    
    if show_output:
        if out:
            print(out)
        if err and exit_code != 0:
            print(err, file=sys.stderr)
    
    return exit_code, out, err

def main():
    print_step("🔧 Diagnosticando y corrigiendo...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SSH_HOST, SSH_PORT, SSH_USER, SSH_PASS, timeout=30)
        print_success("Conectado")
        
        # 1. Verificar directorio
        print_step("1. Verificando directorio...")
        code, out, _ = execute(ssh, f"ls -la {REMOTE_PATH}/app/landing/ 2>&1 | head -5", show_output=False)
        if code == 0 and 'page.tsx' in out:
            print_success("Directorio existe")
        else:
            print_error("Directorio no existe correctamente")
        
        # 2. Verificar Git
        print_step("2. Verificando configuración Git...")
        code, out, _ = execute(ssh, f"cd {REMOTE_PATH} && git remote -v", show_output=True)
        
        # 3. Verificar conectividad a GitHub
        print_step("3. Verificando conectividad a GitHub...")
        code, out, _ = execute(ssh, "ping -c 2 github.com 2>&1", show_output=False)
        if code == 0:
            print_success("Conexión a GitHub OK")
        else:
            print_error("No hay conexión a GitHub")
        
        # 4. Verificar status de Git
        print_step("4. Verificando status de Git...")
        execute(ssh, f"cd {REMOTE_PATH} && git status", show_output=True)
        
        # 5. Limpiar y hacer hard reset
        print_step("5. Limpiando repositorio Git...")
        
        commands = [
            f"cd {REMOTE_PATH}",
            "git remote set-url origin https://github.com/dvillagrablanco/inmova-app.git",
            "git fetch --all 2>&1 || true",
            "git reset --hard HEAD",
            "git clean -fd",
            "git pull origin main --rebase 2>&1 || git reset --hard FETCH_HEAD"
        ]
        
        for cmd in commands:
            print_info(f"Ejecutando: {cmd.split('&&')[-1].strip()}")
            code, out, err = execute(ssh, cmd, show_output=False)
            if 'error' in out.lower() or 'fatal' in out.lower():
                print(f"   {out}")
        
        print_success("Git actualizado")
        
        # 6. Limpiar conflictos
        print_step("6. Limpiando rutas conflictivas...")
        execute(ssh, f"cd {REMOTE_PATH} && rm -rf app/home/ app/\\(public\\)/", show_output=False)
        print_success("Rutas limpias")
        
        # 7. Verificar archivos finales
        print_step("7. Verificando estructura final...")
        execute(ssh, f"cd {REMOTE_PATH} && find app -name 'page.tsx' | grep -E 'landing|home'", show_output=True)
        
        # 8. Limpiar cache
        print_step("8. Limpiando cache...")
        execute(ssh, f"cd {REMOTE_PATH} && rm -rf .next node_modules/.cache", show_output=False)
        print_success("Cache limpio")
        
        # 9. Deployment
        print_step("9. Iniciando deployment...")
        execute(ssh, f"cd {REMOTE_PATH} && nohup bash scripts/deploy-direct.sh > /tmp/deploy-final.log 2>&1 &", show_output=False)
        print_success("Deployment iniciado")
        
        print_info("Esperando que el build inicie...")
        time.sleep(10)
        
        # 10. Monitorear
        print_step("10. Monitoreando build...")
        
        for i in range(20):
            time.sleep(10)
            code, out, _ = execute(ssh, "tail -10 /tmp/deploy-final.log 2>/dev/null", show_output=False)
            
            if 'Building' in out or 'building' in out.lower():
                print_info(f"   [{i+1}/20] 🏗️  Construyendo...")
            elif 'Successfully' in out or 'Contenedor iniciado' in out:
                print_success("Build completado")
                print("\n" + out)
                break
            elif 'error' in out.lower() and 'parallel pages' in out.lower():
                print_error("Error de rutas paralelas detectado")
                print(out)
                break
            elif i % 3 == 0:
                print_info(f"   [{i+1}/20] Build en progreso...")
        
        # 11. Verificar estado final
        print_step("11. Estado final...")
        execute(ssh, "docker ps | grep inmova", show_output=True)
        
        print("\n" + "="*80)
        print_success("Proceso completado")
        print("="*80)
        print("\nVerifica en: https://inmovaapp.com")
        print("\nVer log completo:")
        print(f"  ssh root@{SSH_HOST} 'tail -50 /tmp/deploy-final.log'")
        
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return 1
    finally:
        ssh.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
