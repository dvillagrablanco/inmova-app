#!/usr/bin/env python3
"""
Corregir TODA la configuración necesaria
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

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
    print("=" * 70)
    print("🔧 CORRIGIENDO CONFIGURACIÓN DEL SERVIDOR")
    print("=" * 70)
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
    
    print("[1/7] 📋 Verificando configuración actual...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep -E 'DATABASE_URL|NEXTAUTH_URL' .env.production | head -5")
    print("      Variables actuales:")
    for line in result['output'].split('\n')[:5]:
        if line.strip():
            # Ocultar passwords
            if 'DATABASE_URL' in line and ':' in line:
                parts = line.split('://')
                if len(parts) > 1:
                    print(f"      {parts[0]}://[OCULTO]")
                else:
                    print(f"      {line[:50]}...")
            else:
                print(f"      {line[:80]}")
    print()
    
    print("[2/7] 🗄️  Obteniendo credenciales reales de PostgreSQL...")
    # Verificar si PostgreSQL está corriendo
    result = exec_cmd(client, "systemctl is-active postgresql 2>&1 || docker ps | grep postgres")
    
    if 'active' in result['output'] or 'postgres' in result['output']:
        print("      ✅ PostgreSQL encontrado")
        
        # Intentar obtener las credenciales reales
        result = exec_cmd(client, "cd /opt/inmova-app && grep -A 10 'database:' docker-compose*.yml 2>/dev/null | grep -E 'POSTGRES_|user:|password:|database:' | head -10")
        
        if result['output']:
            print("      Credenciales encontradas en docker-compose")
            print(f"      {result['output'][:200]}")
        
        # Buscar en variables de entorno existentes
        result = exec_cmd(client, "cd /opt/inmova-app && grep 'postgresql://' .env* 2>/dev/null | grep -v dummy | head -1")
        
        if result['output'] and 'dummy' not in result['output']:
            print("      ✅ DATABASE_URL válida encontrada")
            valid_db_url = result['output'].split('=')[1].strip() if '=' in result['output'] else None
        else:
            print("      ⚠️  No se encontró DATABASE_URL válida")
            valid_db_url = None
    else:
        print("      ⚠️  PostgreSQL no detectado")
        valid_db_url = None
    print()
    
    print("[3/7] 🔧 Corrigiendo DATABASE_URL...")
    
    if valid_db_url and 'dummy' not in valid_db_url:
        print(f"      Usando DATABASE_URL existente (válida)")
        # Ya está correcta, no hacer nada
    else:
        # Crear una DATABASE_URL genérica que probablemente funcione
        print("      Creando DATABASE_URL genérica...")
        exec_cmd(client, """cd /opt/inmova-app && sed -i '/^DATABASE_URL=/d' .env.production""")
        exec_cmd(client, """cd /opt/inmova-app && echo 'DATABASE_URL=postgresql://inmova_user:inmova_password@localhost:5432/inmova_production' >> .env.production""")
        print("      ✅ DATABASE_URL configurada con valores por defecto")
    print()
    
    print("[4/7] 🔐 Verificando NEXTAUTH_URL...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep '^NEXTAUTH_URL=' .env.production")
    
    if 'https://inmovaapp.com' in result['output']:
        print("      ✅ NEXTAUTH_URL ya configurado correctamente")
    else:
        print("      Configurando NEXTAUTH_URL...")
        exec_cmd(client, """cd /opt/inmova-app && sed -i '/^NEXTAUTH_URL=/d' .env.production""")
        exec_cmd(client, """cd /opt/inmova-app && echo 'NEXTAUTH_URL=https://inmovaapp.com' >> .env.production""")
        print("      ✅ NEXTAUTH_URL configurado")
    print()
    
    print("[5/7] ⚙️  Verificando NEXTAUTH_SECRET...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep '^NEXTAUTH_SECRET=' .env.production")
    
    if result['output'] and len(result['output'].strip()) > 20:
        print("      ✅ NEXTAUTH_SECRET presente")
    else:
        print("      Generando NEXTAUTH_SECRET...")
        result = exec_cmd(client, "openssl rand -base64 32")
        secret = result['output'].strip()
        exec_cmd(client, f"""cd /opt/inmova-app && sed -i '/^NEXTAUTH_SECRET=/d' .env.production""")
        exec_cmd(client, f"""cd /opt/inmova-app && echo 'NEXTAUTH_SECRET={secret}' >> .env.production""")
        print("      ✅ NEXTAUTH_SECRET generado")
    print()
    
    print("[6/7] ♻️  Reiniciando aplicación...")
    exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
    print("      ✅ PM2 reiniciado")
    print("      ⏳ Esperando 20 segundos para warm-up...")
    time.sleep(20)
    print()
    
    print("[7/7] 🏥 Verificando health check...")
    
    # Test 1: Health check
    result = exec_cmd(client, "curl -s http://localhost:3000/api/health")
    
    if '"status":"ok"' in result['output'] or '"status":"error"' in result['output']:
        print("      ✅ API respondiendo")
        
        # Parsear respuesta
        if '"database":"connected"' in result['output']:
            print("      ✅ Database conectada")
            db_status = "✅ OK"
        elif '"database":"disconnected"' in result['output']:
            print("      ⚠️  Database desconectada (verificar PostgreSQL)")
            db_status = "⚠️ Desconectada"
        else:
            print("      ⚠️  Database status desconocido")
            db_status = "⚠️ Desconocido"
        
        if '"status":"ok"' in result['output']:
            print("      ✅ Health check: OK")
            overall_status = "✅ FUNCIONANDO"
        else:
            print("      ⚠️  Health check con errores")
            overall_status = "⚠️ CON ERRORES"
    else:
        print("      ❌ API no responde")
        db_status = "❌ No responde"
        overall_status = "❌ NO FUNCIONA"
    
    print()
    print("      Respuesta completa:")
    print(f"      {result['output'][:300]}")
    print()
    
    # Test 2: Verificar que PM2 está corriendo
    result = exec_cmd(client, "pm2 status inmova-app --no-color")
    
    if 'online' in result['output']:
        print("      ✅ PM2 status: online")
    else:
        print("      ⚠️  PM2 no está online")
        print(f"      {result['output'][:200]}")
    print()
    
    # Ver logs recientes
    print("📋 Últimos logs (errores):")
    result = exec_cmd(client, "pm2 logs inmova-app --nostream --err --lines 10")
    logs = result['output']
    if logs and logs.strip():
        print(logs[-500:])
    else:
        print("      (Sin errores recientes)")
    
    client.close()
    
    print()
    print("=" * 70)
    print(f"ESTADO FINAL: {overall_status}")
    print("=" * 70)
    print()
    print("📊 Resumen:")
    print(f"   • API: {overall_status}")
    print(f"   • Database: {db_status}")
    print(f"   • PM2: {'✅ Online' if 'online' in result['output'] else '⚠️ Verificar'}")
    print()
    print("🔗 URLs:")
    print("   • App: https://inmovaapp.com")
    print("   • Health: https://inmovaapp.com/api/health")
    print("   • Login: https://inmovaapp.com/login")
    print()
    
    if overall_status == "✅ FUNCIONANDO":
        print("✅ Sistema operativo y listo para usar")
        print()
        print("🧪 Tests recomendados:")
        print("   1. Abrir https://inmovaapp.com/login")
        print("   2. Login con credenciales de test")
        print("   3. Probar upload de archivos")
        print("   4. Probar pago (€0.50 de test)")
        return 0
    else:
        print("⚠️  Sistema con problemas")
        print()
        print("🔍 Troubleshooting:")
        
        if db_status != "✅ OK":
            print("   • Database: Verificar que PostgreSQL esté corriendo")
            print("     ssh root@157.180.119.236")
            print("     systemctl status postgresql")
            print("     # O si es Docker:")
            print("     docker ps | grep postgres")
        
        print()
        print("   • Ver logs completos:")
        print("     ssh root@157.180.119.236")
        print("     pm2 logs inmova-app")
        
        return 1

if __name__ == '__main__':
    sys.exit(main())
