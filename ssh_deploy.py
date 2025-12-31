#!/usr/bin/env python3
"""
🚀 SSH Deployment Script usando subprocess
Alternativa cuando pexpect no está disponible
"""

import subprocess
import sys
import time

SERVER_IP = "157.180.119.236"
SERVER_PASS = "XVcL9qHxqA7f"
SERVER_USER = "root"

def run_ssh_command(command, timeout=30):
    """Ejecutar comando SSH (intenta varias formas)"""
    
    # Intentar 1: Con sshpass (si está disponible)
    try:
        cmd = f'sshpass -p "{SERVER_PASS}" ssh -o StrictHostKeyChecking=no {SERVER_USER}@{SERVER_IP} "{command}"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            return True, result.stdout
        if "sshpass: not found" not in result.stderr and "command not found" not in result.stderr:
            return False, result.stderr
    except Exception as e:
        pass
    
    # Intentar 2: SSH con key (si está configurada)
    try:
        cmd = f'ssh -o StrictHostKeyChecking=no {SERVER_USER}@{SERVER_IP} "{command}"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            return True, result.stdout
    except Exception as e:
        pass
    
    return False, "No se pudo conectar: sshpass no disponible y SSH key no configurada"

def main():
    print("\n╔═══════════════════════════════════════════════╗")
    print("║   🚀 SSH Deployment Test                      ║")
    print("╚═══════════════════════════════════════════════╝\n")
    
    print(f"Servidor: {SERVER_IP}")
    print(f"Usuario: {SERVER_USER}\n")
    
    print("Probando conexión SSH...")
    success, output = run_ssh_command("echo 'Conectado exitosamente'")
    
    if success:
        print("✅ Conexión SSH exitosa")
        print(f"   {output.strip()}\n")
        
        print("Verificando sistema...")
        success, output = run_ssh_command("cat /etc/os-release | grep PRETTY_NAME")
        if success:
            print(f"✅ {output.strip()}\n")
        
        print("¿Ejecutar deployment completo? (y/n): ", end='')
        response = input().lower()
        
        if response == 'y':
            print("\n⚠️  El deployment completo debe ejecutarse desde tu máquina local")
            print("    usando: bash full-deploy-with-domain.sh\n")
    else:
        print(f"❌ Error: {output}")
        print("\n⚠️  Este entorno cloud no tiene sshpass instalado")
        print("   Debes ejecutar el deployment desde TU máquina local\n")
        print("Comandos para ejecutar:")
        print("  1. cd /workspace")
        print("  2. bash full-deploy-with-domain.sh\n")

if __name__ == "__main__":
    main()
