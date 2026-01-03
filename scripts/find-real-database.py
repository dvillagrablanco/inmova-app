#!/usr/bin/env python3
"""
Encontrar y configurar la DATABASE_URL real
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import re

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return {
        'exit': exit_status,
        'output': stdout.read().decode('utf-8', errors='ignore'),
        'error': stderr.read().decode('utf-8', errors='ignore')
    }

def main():
    print("🔍 BUSCANDO DATABASE_URL REAL")
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("[1] Buscando PostgreSQL corriendo...")
    
    # Check systemctl
    result = exec_cmd(client, "systemctl is-active postgresql 2>&1")
    systemctl_postgres = 'active' in result['output']
    print(f"   Systemctl PostgreSQL: {'✅ Active' if systemctl_postgres else '❌ Inactive'}")
    
    # Check Docker
    result = exec_cmd(client, "docker ps 2>&1 | grep postgres")
    docker_postgres = 'postgres' in result['output']
    print(f"   Docker PostgreSQL: {'✅ Running' if docker_postgres else '❌ Not found'}")
    
    if docker_postgres:
        print(f"   Docker info: {result['output'][:100]}")
    
    print()
    print("[2] Buscando DATABASE_URL en archivos...")
    
    # Buscar en todos los .env
    result = exec_cmd(client, "find /opt/inmova-app -name '.env*' -type f -exec grep -H 'postgresql://' {} \\; 2>/dev/null | grep -v node_modules | grep -v dummy")
    
    if result['output']:
        print("   DATABASE_URLs encontradas:")
        for line in result['output'].split('\n'):
            if line.strip() and 'dummy' not in line.lower():
                # Extraer solo el nombre del archivo y parte de la URL
                if ':' in line:
                    file, url = line.split(':', 1)
                    # Ocultar password
                    url_masked = re.sub(r':([^@]+)@', ':***@', url)
                    print(f"   📄 {file.split('/')[-1]}: {url_masked[:80]}")
    
    print()
    print("[3] Verificando .env.production actual...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep '^DATABASE_URL=' .env.production | head -1")
    
    current_url = result['output'].strip()
    print(f"   Actual: {current_url[:100]}")
    
    if 'dummy-build-host' in current_url:
        print("   ❌ Contiene dummy-build-host")
        
        print()
        print("[4] Buscando DATABASE_URL válida...")
        
        # Intentar obtener de .env (sin .production)
        result = exec_cmd(client, "cd /opt/inmova-app && cat .env 2>/dev/null | grep '^DATABASE_URL=' | head -1")
        
        if result['output'] and 'dummy' not in result['output']:
            valid_url = result['output'].strip()
            print(f"   ✅ Encontrada en .env: {valid_url[:80]}")
            
            print()
            print("[5] Actualizando .env.production...")
            # Reemplazar la línea completa
            escaped_url = valid_url.replace('/', '\\/')
            exec_cmd(client, f"cd /opt/inmova-app && sed -i '/^DATABASE_URL=/d' .env.production")
            exec_cmd(client, f"cd /opt/inmova-app && echo '{valid_url}' >> .env.production")
            print("   ✅ DATABASE_URL actualizada")
            
            print()
            print("[6] Verificando cambio...")
            result = exec_cmd(client, "cd /opt/inmova-app && grep '^DATABASE_URL=' .env.production | head -1")
            new_url = result['output'].strip()
            
            if 'dummy' not in new_url:
                print("   ✅ DATABASE_URL corregida exitosamente")
                
                print()
                print("[7] Reiniciando aplicación...")
                exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
                print("   ✅ PM2 reiniciado")
                
                import time
                print("   ⏳ Esperando 15 segundos...")
                time.sleep(15)
                
                print()
                print("[8] Verificando health check...")
                result = exec_cmd(client, "curl -s http://localhost:3000/api/health")
                
                if '"database":"connected"' in result['output']:
                    print("   ✅ DATABASE CONECTADA!")
                    print()
                    print("=" * 70)
                    print("✅ CONFIGURACIÓN CORREGIDA Y FUNCIONANDO")
                    print("=" * 70)
                    client.close()
                    return 0
                else:
                    print("   ⚠️  Database aún desconectada")
                    print(f"   Respuesta: {result['output'][:200]}")
            else:
                print("   ❌ DATABASE_URL aún contiene dummy")
        else:
            print("   ❌ No se encontró DATABASE_URL válida en .env")
            
            print()
            print("⚠️  SOLUCIÓN MANUAL REQUERIDA")
            print()
            print("Necesitas obtener la DATABASE_URL real de uno de estos lugares:")
            print("   1. Vercel Dashboard (si el proyecto está en Vercel)")
            print("   2. Docker Compose (si PostgreSQL está en Docker)")
            print("   3. Servidor PostgreSQL local")
            print()
            print("Luego ejecuta:")
            print("   ssh root@157.180.119.236")
            print("   nano /opt/inmova-app/.env.production")
            print("   # Buscar DATABASE_URL y reemplazar con la correcta")
            print("   pm2 restart inmova-app --update-env")
    else:
        print("   ✅ No contiene dummy-build-host")
        
        print()
        print("[4] Reiniciando para aplicar cambios...")
        exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
        print("   ✅ PM2 reiniciado")
        
        import time
        time.sleep(15)
        
        print()
        print("[5] Verificando health check...")
        result = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        
        if '"database":"connected"' in result['output']:
            print("   ✅ DATABASE CONECTADA!")
            print()
            print("=" * 70)
            print("✅ TODO FUNCIONANDO")
            print("=" * 70)
            client.close()
            return 0
        else:
            print("   ⚠️  Database desconectada a pesar de URL válida")
            print(f"   Respuesta: {result['output'][:200]}")
    
    client.close()
    
    print()
    print("=" * 70)
    print("⚠️  CONFIGURACIÓN INCOMPLETA")
    print("=" * 70)
    return 1

if __name__ == '__main__':
    sys.exit(main())
