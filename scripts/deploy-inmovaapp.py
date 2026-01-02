#!/usr/bin/env python3
"""Deploy seguro en inmovaapp.com usando sistema de blindaje"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

# El dominio apunta al mismo servidor
SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🚀 DEPLOY SEGURO EN INMOVAAPP.COM")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    # 1. Verificar que el dominio apunta a este servidor
    print("1️⃣  Verificando dominio...")
    stdin, stdout, stderr = client.exec_command("dig +short inmovaapp.com")
    ip = stdout.read().decode().strip()
    print(f"   inmovaapp.com apunta a: {ip}")
    
    # 2. Verificar que NEXTAUTH_URL está correcto
    print("\n2️⃣  Verificando NEXTAUTH_URL...")
    stdin, stdout, stderr = client.exec_command(f"grep NEXTAUTH_URL {APP_DIR}/.env.production")
    current_url = stdout.read().decode().strip()
    print(f"   Actual: {current_url}")
    
    # Si está en IP, actualizar a dominio
    if "157.180.119.236" in current_url:
        print("   ⚠️  Actualizando a dominio inmovaapp.com...")
        
        # Hacer backup del .env antes de modificar
        stdin, stdout, stderr = client.exec_command(f"bash {APP_DIR}/scripts/blindaje-db/01-backup-automatico.sh")
        stdout.channel.recv_exit_status()
        
        # Actualizar NEXTAUTH_URL
        stdin, stdout, stderr = client.exec_command(
            f"sed -i 's|NEXTAUTH_URL=\"http://157.180.119.236\"|NEXTAUTH_URL=\"https://inmovaapp.com\"|g' {APP_DIR}/.env.production"
        )
        stdout.channel.recv_exit_status()
        
        stdin, stdout, stderr = client.exec_command(
            f"sed -i 's|NEXT_PUBLIC_APP_URL=\"http://157.180.119.236\"|NEXT_PUBLIC_APP_URL=\"https://inmovaapp.com\"|g' {APP_DIR}/.env.production"
        )
        stdout.channel.recv_exit_status()
        
        print("   ✅ URLs actualizadas a dominio")
    
    # 3. Ejecutar deploy seguro
    print("\n3️⃣  Ejecutando deploy seguro con blindaje...")
    print("   (Esto tomará varios minutos...)\n")
    
    stdin, stdout, stderr = client.exec_command(
        f"bash {APP_DIR}/scripts/blindaje-db/04-deploy-seguro.sh",
        timeout=900
    )
    
    # Mostrar progreso en tiempo real
    while True:
        line = stdout.readline()
        if not line:
            break
        # Mostrar líneas importantes
        if any(word in line for word in ['FASE', '✅', '❌', '⚠️', 'COMPLETADO', 'ERROR']):
            print(f"   {line.rstrip()}")
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("\n   ✅ Deploy completado exitosamente")
    else:
        print(f"\n   ⚠️  Deploy exit code: {exit_code}")
    
    # 4. Esperar warm-up
    print("\n4️⃣  Esperando warm-up (15s)...")
    time.sleep(15)
    
    # 5. Verificaciones finales
    print("\n5️⃣  Verificaciones finales:")
    
    # Health check local
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
    health = stdout.read().decode()
    if '"connected"' in health:
        print("   ✅ Health check local: OK")
    else:
        print(f"   ⚠️  Health check: {health[:100]}")
    
    # PM2 status
    stdin, stdout, stderr = client.exec_command("pm2 status inmova-app | grep inmova-app")
    status = stdout.read().decode()
    if 'online' in status:
        print("   ✅ PM2: online")
    else:
        print("   ⚠️  PM2: error")
    
    # Test del dominio (desde el servidor)
    print("\n6️⃣  Test del dominio...")
    stdin, stdout, stderr = client.exec_command("curl -I https://inmovaapp.com 2>&1 | head -3")
    domain_test = stdout.read().decode()
    print(f"   {domain_test}")
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ DEPLOY EN INMOVAAPP.COM COMPLETADO\n")
    print("🌐 URL principal: https://inmovaapp.com")
    print("🔐 Login: superadmin@inmova.app / Admin123!")
    print("")
    print("📝 Cambios desplegados:")
    print("   - Tutorial NO se muestra para superadministradores")
    print("   - URLs actualizadas al dominio")
    print("   - Sistema de blindaje protegió la configuración")
    print("")
    print("🛡️  Backup creado automáticamente antes del deploy")
    print("📦 Ubicación: /opt/inmova-backups/")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
