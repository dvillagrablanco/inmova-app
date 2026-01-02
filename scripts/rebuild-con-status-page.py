#!/usr/bin/env python3
"""
Rebuild completo para incorporar NEXT_PUBLIC_STATUS_PAGE_URL
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

def exec_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    return exit_code, stdout.read().decode(), stderr.read().decode()

def main():
    print("🔄 Rebuild completo para incorporar Status Page URL...\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
    
    print("✅ Conectado al servidor\n")
    
    try:
        # 1. Stop PM2
        print("⏸️  Deteniendo PM2...")
        exec_cmd(client, "pm2 stop inmova-app")
        print("✅ PM2 detenido\n")
        
        # 2. Limpiar cache
        print("🧹 Limpiando cache de Next.js...")
        exec_cmd(client, "cd /opt/inmova-app && rm -rf .next/cache")
        print("✅ Cache limpiado\n")
        
        # 3. Verificar .env.production
        print("🔍 Verificando variables de entorno...")
        _, output, _ = exec_cmd(client, "cd /opt/inmova-app && grep 'PUBLIC.*URL' .env.production")
        print(output)
        
        # 4. Rebuild (con timeout largo)
        print("🔨 Rebuilding Next.js (esto toma ~3 minutos)...")
        exit_code, output, error = exec_cmd(client, "cd /opt/inmova-app && npm run build", timeout=300)
        
        if exit_code != 0:
            print(f"⚠️  Build tuvo exit code {exit_code}")
            print(f"Error: {error[-500:]}")
        else:
            print("✅ Build completado\n")
        
        # 5. Restart PM2
        print("🔄 Reiniciando PM2 con variables actualizadas...")
        exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
        print("✅ PM2 reiniciado\n")
        
        # 6. Esperar warm-up
        print("⏳ Esperando 20 segundos para warm-up...\n")
        time.sleep(20)
        
        # 7. Check status
        print("📊 Estado del servidor:")
        _, output, _ = exec_cmd(client, "pm2 status inmova-app")
        print(output)
        
        # 8. Verificar health
        print("\n🧪 Verificando health:")
        exit_code, output, _ = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/landing")
        print(f"   Landing page: HTTP {output.strip()}")
        
        print("\n" + "="*60)
        print("✅ REBUILD COMPLETADO")
        print("="*60)
        print()
        print("🧪 VERIFICACIÓN MANUAL:")
        print("  1. Abre: https://inmovaapp.com/landing")
        print("  2. Scroll al Footer (abajo)")
        print("  3. Busca: 'Estado del Sistema' con punto verde")
        print("  4. Click en el link")
        print("  5. Debe abrir: https://inmova.betteruptime.com")
        print()
        print("Si Cloudflare cachea, espera 5 min o purga el cache:")
        print("  → Dashboard Cloudflare → Caching → Purge Everything")
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
