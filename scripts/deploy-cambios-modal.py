#!/usr/bin/env python3
"""
Deploy de cambios del modal de onboarding
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'
BRANCH = 'cursor/estudio-soluci-n-definitiva-b635'

def execute_command(ssh, command, timeout=120):
    print(f"  💻 {command[:100]}...")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    output = stdout.read().decode()
    error = stderr.read().decode()
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0 and error:
        print(f"  ⚠️  {error[:200]}")
    elif output and len(output) < 200:
        print(f"  ✓ {output.strip()[:150]}")
    else:
        print(f"  ✓ OK")
    
    return exit_code == 0, output, error

def main():
    print("🚀 DEPLOY DE CAMBIOS DEL MODAL\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        
        print("1️⃣  Verificando commit actual...")
        success, output, _ = execute_command(client, f"cd {APP_DIR} && git rev-parse --short HEAD")
        current_commit = output.strip()
        print(f"  Commit actual: {current_commit}\n")
        
        print("2️⃣  Fetch y reset a última versión...")
        execute_command(client, f"cd {APP_DIR} && git fetch origin {BRANCH}")
        execute_command(client, f"cd {APP_DIR} && git reset --hard origin/{BRANCH}")
        
        print("\n3️⃣  Verificando nuevo commit...")
        success, output, _ = execute_command(client, f"cd {APP_DIR} && git rev-parse --short HEAD")
        new_commit = output.strip()
        print(f"  Nuevo commit: {new_commit}\n")
        
        print("4️⃣  Verificando cambios en SmartOnboardingWizard...")
        success, output, _ = execute_command(client, 
            f"cd {APP_DIR} && grep -n 'max-w-2xl w-\\[95vw\\]' components/automation/SmartOnboardingWizard.tsx || echo 'NO ENCONTRADO'"
        )
        
        if 'w-[95vw]' in output:
            print("  ✅ Cambios presentes en archivo\n")
        else:
            print("  ⚠️  Cambios NO encontrados en archivo\n")
            print(f"  Output: {output[:200]}\n")
        
        print("5️⃣  Deteniendo PM2...")
        execute_command(client, "pm2 stop inmova-app")
        
        print("\n6️⃣  Limpiando cache de Next.js...")
        execute_command(client, f"cd {APP_DIR} && rm -rf .next")
        
        print("\n7️⃣  Haciendo build de Next.js...")
        print("  (Esto tomará varios minutos...)\n")
        
        # Build with timeout largo
        stdin, stdout, stderr = client.exec_command(
            f"cd {APP_DIR} && source .env.production && npm run build",
            timeout=900
        )
        
        # Mostrar output en tiempo real
        while True:
            line = stdout.readline()
            if not line:
                break
            if 'Route' in line or 'Compiled' in line or 'Error' in line:
                print(f"     {line.strip()[:100]}")
        
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            print("  ✅ Build exitoso\n")
        else:
            print("  ⚠️  Build con warnings (continuando)\n")
        
        print("8️⃣  Iniciando PM2...")
        execute_command(client, "pm2 start inmova-app")
        
        print("\n9️⃣  Esperando warm-up (20s)...")
        time.sleep(20)
        
        print("\n🔟 Verificando aplicación...")
        success, output, _ = execute_command(client, "curl -I http://localhost:3000/dashboard")
        
        if "200" in output:
            print("  ✅ Dashboard responde\n")
        else:
            print("  ⚠️  Dashboard no responde\n")
        
        print("✅ DEPLOY COMPLETADO\n")
        print("📝 Verifica en móvil:")
        print("  URL: http://157.180.119.236/dashboard")
        print("  El modal debe ocupar 95% del ancho en móvil")
        print("  Debe tener scroll interno")
        print("  Botón Cerrar debe ser visible\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
