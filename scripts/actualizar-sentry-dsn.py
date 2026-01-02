#!/usr/bin/env python3
"""
Actualizar Sentry DSN con el correcto
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

# NUEVO DSN
NEW_SENTRY_DSN = 'https://cce659e12e89f9c1e005ff46bedb7550@o4510643145932800.ingest.de.sentry.io/4510643214483536'

def exec_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    return exit_code, stdout.read().decode(), stderr.read().decode()

def main():
    print("🔧 Actualizando Sentry DSN...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
    
    print("✅ Conectado\n")
    
    try:
        # Backup
        import time
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        print("📦 Creando backup...")
        exec_cmd(client, f"cd /opt/inmova-app && cp .env.production .env.production.backup.{timestamp}")
        print("✅ Backup creado\n")
        
        # Reemplazar DSN antiguo con el nuevo
        print("🔄 Actualizando DSN...")
        
        # Leer el .env actual
        _, env_content, _ = exec_cmd(client, "cd /opt/inmova-app && cat .env.production")
        
        # Reemplazar todas las ocurrencias del DSN
        old_dsn_pattern = "https://f3e76aca26cfeef767c4f3d3b5b271fd@o4510643145932800.ingest.de.sentry.io/4510643147505744"
        new_env = env_content.replace(old_dsn_pattern, NEW_SENTRY_DSN)
        
        # Escribir el nuevo .env
        sftp = client.open_sftp()
        with sftp.open('/opt/inmova-app/.env.production', 'w') as f:
            f.write(new_env)
        sftp.close()
        
        print("✅ DSN actualizado\n")
        
        # Verificar
        print("🔍 Verificando nuevo DSN...")
        _, output, _ = exec_cmd(client, "cd /opt/inmova-app && grep 'SENTRY_DSN' .env.production | head -3")
        for line in output.strip().split('\n'):
            if 'SENTRY_DSN' in line:
                print(f"   {line}")
        print()
        
        # Reiniciar PM2
        print("🔄 Reiniciando PM2...")
        exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
        print("✅ PM2 reiniciado\n")
        
        import time
        print("⏳ Esperando 15 segundos...\n")
        time.sleep(15)
        
        # Verificar
        print("📊 Estado:")
        _, output, _ = exec_cmd(client, "pm2 status inmova-app")
        print(output)
        
        print("\n" + "="*60)
        print("✅ SENTRY DSN ACTUALIZADO")
        print("="*60)
        print()
        print(f"🎯 Nuevo DSN: {NEW_SENTRY_DSN[:50]}...")
        print()
        print("🧪 VERIFICACIÓN:")
        print("  1. Abre https://inmovaapp.com")
        print("  2. F12 → Console")
        print("  3. Ejecuta: myUndefinedFunction();")
        print("  4. Ve a: https://sentry.io/issues/")
        print("  5. Debe aparecer el error en 1-2 minutos")
        print()
        
    finally:
        client.close()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
