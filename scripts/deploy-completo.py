#!/usr/bin/env python3
"""
Deploy completo al servidor con actualización de código
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def execute_command(ssh, command, timeout=120):
    """Ejecutar comando y retornar output"""
    print(f"  💻 {command[:80]}...")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    output = stdout.read().decode()
    error = stderr.read().decode()
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0:
        if error:
            print(f"  ⚠️  Error: {error[:200]}")
        return False, output, error
    
    if output and len(output) < 500:
        print(f"  ✓ {output.strip()[:200]}")
    elif output:
        print(f"  ✓ Output: {len(output)} bytes")
    
    return True, output, error

def main():
    print("🚀 DEPLOY COMPLETO AL SERVIDOR\n")
    print(f"📍 Servidor: {SERVER_HOST}")
    print(f"📁 Directorio: {APP_DIR}\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("1️⃣  Conectando al servidor...")
        client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
        print("  ✓ Conectado\n")
        
        print("2️⃣  Verificando estado actual...")
        success, output, _ = execute_command(client, f"cd {APP_DIR} && git status --short")
        if output:
            print(f"  Archivos modificados en servidor:\n{output[:500]}")
        
        print("\n3️⃣  Haciendo backup del código actual...")
        execute_command(client, f"cd {APP_DIR} && tar -czf ../backup-$(date +%Y%m%d-%H%M%S).tar.gz .")
        
        print("\n4️⃣  Actualizando código desde repositorio...")
        # Stash local changes if any
        execute_command(client, f"cd {APP_DIR} && git stash")
        # Pull latest
        success, output, error = execute_command(client, f"cd {APP_DIR} && git pull origin main")
        if not success:
            print("  ⚠️  Git pull falló, intentando reset...")
            execute_command(client, f"cd {APP_DIR} && git fetch origin")
            execute_command(client, f"cd {APP_DIR} && git reset --hard origin/main")
        
        print("\n5️⃣  Limpiando cache de Next.js...")
        execute_command(client, f"cd {APP_DIR} && rm -rf .next/cache .next/server")
        
        print("\n6️⃣  Instalando dependencias...")
        success, output, error = execute_command(client, f"cd {APP_DIR} && npm install", timeout=300)
        
        print("\n7️⃣  Reiniciando PM2...")
        execute_command(client, "pm2 restart inmova-app")
        
        print("\n8️⃣  Esperando 15 segundos para warm-up...")
        time.sleep(15)
        
        print("\n9️⃣  Verificando que la aplicación responde...")
        success, output, error = execute_command(client, "curl -I http://localhost:3000/login")
        
        if "HTTP" in output:
            if "200" in output:
                print("  ✅ Aplicación respondiendo correctamente (200 OK)")
            else:
                print(f"  ⚠️  Respuesta HTTP: {output.split()[1] if len(output.split()) > 1 else 'unknown'}")
        else:
            print("  ❌ Aplicación no responde")
            return False
        
        print("\n🔟 Verificando estado de PM2...")
        execute_command(client, "pm2 status inmova-app")
        
        print("\n✅ DEPLOY COMPLETADO EXITOSAMENTE\n")
        print("📝 Próximos pasos:")
        print("  1. Verificar en navegador: http://157.180.119.236/login")
        print("  2. Probar login con admin@inmova.app")
        print("  3. Verificar tours virtuales en /configuracion")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
