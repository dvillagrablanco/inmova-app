#!/usr/bin/env python3
"""Reiniciar aplicación correctamente"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🚀 REINICIANDO APLICACIÓN\n")
    
    # 1. Limpiar PM2
    print("1️⃣  Limpiando PM2...")
    stdin, stdout, stderr = client.exec_command("pm2 delete inmova-app 2>/dev/null; pm2 kill")
    stdout.channel.recv_exit_status()
    time.sleep(2)
    
    # 2. Matar cualquier proceso en puerto 3000
    print("2️⃣  Liberando puerto 3000...")
    stdin, stdout, stderr = client.exec_command("fuser -k 3000/tcp 2>/dev/null || true")
    stdout.channel.recv_exit_status()
    time.sleep(2)
    
    # 3. Verificar que .next existe
    print("3️⃣  Verificando build...")
    stdin, stdout, stderr = client.exec_command(f"ls -la {APP_DIR}/.next 2>&1 | head -5")
    build_check = stdout.read().decode()
    
    if ".next" not in build_check or "No such file" in build_check:
        print("   ⚠️  Build no existe, generando...")
        stdin, stdout, stderr = client.exec_command(
            f"cd {APP_DIR} && npm run build 2>&1 | tail -20",
            timeout=600
        )
        build_output = stdout.read().decode()
        print(build_output)
        
        exit_code = stdout.channel.recv_exit_status()
        if exit_code != 0:
            print("   ❌ Error en build")
            print(stderr.read().decode())
            sys.exit(1)
    else:
        print("   ✅ Build existe")
    
    # 4. Iniciar con PM2
    print("\n4️⃣  Iniciando con PM2...")
    
    # Usar el script de inicio seguro
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && bash scripts/blindaje-db/start-definitivo.sh 2>&1",
        timeout=60
    )
    
    output = stdout.read().decode()
    print(output)
    
    # 5. Esperar warm-up
    print("\n5️⃣  Esperando warm-up (20s)...")
    time.sleep(20)
    
    # 6. Verificaciones
    print("\n6️⃣  Verificaciones finales:")
    
    # PM2 status
    stdin, stdout, stderr = client.exec_command("pm2 status inmova-app | grep inmova-app")
    status = stdout.read().decode()
    if 'online' in status:
        print("   ✅ PM2: online")
    else:
        print(f"   ❌ PM2: {status}")
        
        # Ver logs de error
        print("\n   Logs de error:")
        stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --lines 20 --nostream")
        print(stdout.read().decode())
        sys.exit(1)
    
    # Health check
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
    health = stdout.read().decode()
    
    if '"connected"' in health:
        print("   ✅ Health check: OK")
        print(f"      {health}")
    else:
        print(f"   ⚠️  Health check: {health[:200]}")
    
    # Test login page
    stdin, stdout, stderr = client.exec_command("curl -I http://localhost:3000/login 2>&1 | head -2")
    login_test = stdout.read().decode()
    if "200" in login_test or "301" in login_test or "302" in login_test:
        print("   ✅ Login page: accesible")
    else:
        print(f"   ⚠️  Login page: {login_test}")
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ APLICACIÓN REINICIADA\n")
    print("🌐 URL: https://inmovaapp.com")
    print("🔐 Login: superadmin@inmova.app / Admin123!")
    print("")
    print("📝 El tutorial NO aparecerá para superadministradores")
    print("")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
