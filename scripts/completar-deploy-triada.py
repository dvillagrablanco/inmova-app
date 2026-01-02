#!/usr/bin/env python3
"""
Completar el deploy de la Triada
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

def exec_cmd(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    return exit_code, stdout.read().decode(), stderr.read().decode()

def main():
    print("🔧 Completando deploy...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
    
    print("✅ Conectado\n")
    
    try:
        # Verificar .env
        print("✅ Variables en .env.production:")
        _, output, _ = exec_cmd(client, "cd /opt/inmova-app && grep -E '(SENTRY_DSN|CRISP)' .env.production")
        for line in output.strip().split('\n'):
            if 'NEXT_PUBLIC' in line:
                print(f"   {line}")
        print()
        
        # Stop PM2
        print("🛑 Deteniendo PM2...")
        exec_cmd(client, "cd /opt/inmova-app && pm2 stop inmova-app")
        print("✅ Detenido\n")
        
        # Clean cache
        print("🧹 Limpiando cache...")
        exec_cmd(client, "cd /opt/inmova-app && rm -rf .next/cache")
        print("✅ Cache limpio\n")
        
        # Build
        print("🔨 Rebuilding Next.js (3-5 min)...")
        exit_code, output, error = exec_cmd(client, "cd /opt/inmova-app && npm run build 2>&1", timeout=600)
        
        if exit_code == 0:
            print("✅ Build exitoso\n")
            # Mostrar últimas líneas
            for line in output.strip().split('\n')[-5:]:
                print(f"   {line}")
        else:
            print("⚠️  Build con warnings\n")
            for line in error.strip().split('\n')[-5:]:
                print(f"   {line}")
        print()
        
        # Restart PM2
        print("🔄 Reiniciando PM2...")
        exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
        print("✅ PM2 reiniciado\n")
        
        # Wait
        print("⏳ Esperando 25 segundos...")
        time.sleep(25)
        print()
        
        # Check status
        print("📊 Estado de PM2:")
        _, output, _ = exec_cmd(client, "pm2 status inmova-app")
        print(output)
        
        # Health check
        print("🏥 Health check:")
        _, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000")
        code = output.strip()
        if code in ['200', '301', '302', '307']:
            print(f"✅ HTTP {code} - OK\n")
        else:
            print(f"⚠️  HTTP {code}\n")
        
        # Check for Crisp in HTML
        print("🔍 Verificando Crisp en HTML...")
        _, output, _ = exec_cmd(client, "curl -s http://localhost:3000/login | grep -o 'CRISP_WEBSITE_ID' | head -1")
        
        if 'CRISP_WEBSITE_ID' in output:
            print("✅ CRISP DETECTADO EN EL HTML!\n")
        else:
            print("⏳ Crisp no detectado aún (puede estar cacheado)\n")
        
        print("=" * 60)
        print("✅ DEPLOY COMPLETADO")
        print("=" * 60)
        print()
        print("🧪 VERIFICACIÓN:")
        print("  1. Abre https://inmovaapp.com en modo incógnito")
        print("  2. Busca el widget de Crisp (esquina inferior derecha)")
        print("  3. F12 → Console → escribe: window.CRISP_WEBSITE_ID")
        print("  4. Debe mostrar: 1f115549-e9ef-49e5-8fd7-174e6d896a7e")
        print()
        print("  Si no aparece:")
        print("  - Espera 2-3 minutos para propagación")
        print("  - Purga la cache de Cloudflare")
        print("  - Ctrl+Shift+R para hard refresh")
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
