#!/usr/bin/env python3
"""
Buscar SENTRY_DSN real en el servidor
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import re

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd, timeout=60):
    """Ejecutar comando SSH"""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        return exit_status, output
    except Exception as e:
        return -1, str(e)

def main():
    print("=" * 70)
    print("🔍 BUSCANDO SENTRY DSN REAL")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    found_dsn = None
    
    try:
        # 1. Buscar en archivos .env de backup
        print("🔍 Buscando en archivos de backup...")
        status, output = exec_cmd(client, f"grep -r 'SENTRY_DSN' {APP_PATH}/.env* 2>/dev/null | grep -v '\"https://...\"' | grep -v 'example'")
        if output.strip():
            print(output)
            # Extraer DSN
            for line in output.split('\n'):
                match = re.search(r'SENTRY_DSN[=:]["\']*([^"\']+sentry\.io[^"\']+)', line)
                if match:
                    found_dsn = match.group(1)
                    print(f"\n✅ Encontrado: {found_dsn[:50]}...")
        
        # 2. Buscar en PM2 dump
        print("\n🔍 Buscando en PM2 dump...")
        status, output = exec_cmd(client, "cat /root/.pm2/dump.pm2 | grep -o 'SENTRY_DSN[^,}]*' | head -5")
        if output.strip():
            print(output)
            match = re.search(r'SENTRY_DSN[":"]+([^"]+)', output)
            if match and 'sentry.io' in match.group(1):
                found_dsn = match.group(1)
        
        # 3. Buscar patrón de DSN de Sentry (https://xxx@xxx.ingest.sentry.io/xxx)
        print("\n🔍 Buscando patrón de DSN de Sentry...")
        status, output = exec_cmd(client, f"grep -roh 'https://[^@]*@[^.]*\\.ingest\\.sentry\\.io/[0-9]*' {APP_PATH} --include='*.env*' --include='*.json' --include='*.ts' --include='*.js' 2>/dev/null | head -5")
        if output.strip():
            print(output)
            found_dsn = output.strip().split('\n')[0]
        
        # 4. Buscar en documentación
        print("\n🔍 Buscando en documentación...")
        status, output = exec_cmd(client, f"grep -r 'sentry.io' {APP_PATH}/docs {APP_PATH}/*.md 2>/dev/null | head -10")
        if output.strip():
            print(output[:500])
            for line in output.split('\n'):
                match = re.search(r'https://[^@\s]+@[^.\s]+\.ingest\.sentry\.io/[0-9]+', line)
                if match:
                    found_dsn = match.group()
                    print(f"\n✅ Encontrado en docs: {found_dsn[:50]}...")
        
        # 5. Buscar en /home/deploy
        print("\n🔍 Buscando en /home/deploy...")
        status, output = exec_cmd(client, "grep -r 'SENTRY_DSN' /home/deploy 2>/dev/null | grep -v 'example' | head -10")
        if output.strip():
            print(output)
        
        # 6. Verificar si el DSN actual es válido
        print("\n🔍 Verificando DSN actual...")
        status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep SENTRY_DSN")
        print(f"DSN actual: {output.strip()}")
        
        if found_dsn and 'sentry.io' in found_dsn:
            print("\n" + "=" * 70)
            print("✅ DSN DE SENTRY ENCONTRADO")
            print("=" * 70)
            print(f"\n{found_dsn}")
            
            # Actualizar .env.production
            print("\n🔧 Actualizando .env.production...")
            exec_cmd(client, f"sed -i 's|SENTRY_DSN=.*|SENTRY_DSN=\"{found_dsn}\"|' {APP_PATH}/.env.production")
            
            # Reiniciar PM2
            print("🔄 Reiniciando PM2...")
            exec_cmd(client, "pm2 restart inmova-app --update-env")
            
            print("✅ Sentry DSN configurado")
        else:
            print("\n" + "=" * 70)
            print("⚠️ NO SE ENCONTRÓ UN DSN VÁLIDO DE SENTRY")
            print("=" * 70)
            print("\nPara configurar Sentry:")
            print("1. Ve a https://sentry.io")
            print("2. Crea un proyecto o usa uno existente")
            print("3. En Settings > Projects > Client Keys (DSN)")
            print("4. Copia el DSN que tiene formato:")
            print("   https://xxxxx@yyyy.ingest.sentry.io/zzzzz")
            
            # Limpiar el placeholder
            print("\n🧹 Eliminando placeholder de SENTRY_DSN...")
            exec_cmd(client, f"sed -i '/SENTRY_DSN=\"https:\\/\\/\\.\\.\\.\"$/d' {APP_PATH}/.env.production")
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
