#!/usr/bin/env python3
"""Reset completo del servidor y reinicio"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def exec_cmd(ssh, cmd, timeout=30):
    """Ejecutar comando con timeout"""
    try:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        output = stdout.read().decode()
        error = stderr.read().decode()
        return exit_code == 0, output, error
    except Exception as e:
        return False, "", str(e)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🔄 RESET COMPLETO DEL SERVIDOR\n")
    
    # 1. Matar PM2
    print("1️⃣  Limpiando PM2...")
    exec_cmd(client, "pm2 delete all", timeout=10)
    exec_cmd(client, "pm2 kill", timeout=10)
    time.sleep(2)
    print("  ✅ PM2 limpiado")
    
    # 2. Matar procesos en puerto 3000
    print("\n2️⃣  Liberando puerto 3000...")
    success, pids, _ = exec_cmd(client, "lsof -ti:3000", timeout=5)
    if pids.strip():
        exec_cmd(client, f"kill -9 {pids.strip()}", timeout=5)
        print(f"  ✅ Procesos terminados: {pids.strip()[:50]}")
    else:
        print("  (Puerto ya libre)")
    
    time.sleep(3)
    
    # 3. Verificar .env
    print("\n3️⃣  Verificando .env.production...")
    success, content, _ = exec_cmd(client, f"cat {APP_DIR}/.env.production | grep -E '(SECRET|DATABASE_URL|NODE_ENV)'", timeout=5)
    if 'NEXTAUTH_SECRET' in content and 'DATABASE_URL' in content:
        print("  ✅ Variables presentes")
    else:
        print("  ⚠️  Variables incompletas")
    
    # 4. Iniciar aplicación simple (sin PM2 primero)
    print("\n4️⃣  Iniciando aplicación en background...")
    
    # Usar nohup para iniciar en background
    exec_cmd(client, f"cd {APP_DIR} && nohup bash -c 'source .env.production && npm start' > /tmp/inmova.log 2>&1 &", timeout=5)
    
    print("\n5️⃣  Esperando warm-up (30s)...")
    time.sleep(30)
    
    # 5. Verificar que responde
    print("\n6️⃣  Verificaciones:")
    
    # Health
    success, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health", timeout=10)
    if success and 'ok' in output:
        print("  ✅ Health: OK")
    else:
        print(f"  ⚠️  Health: {output[:80] if output else 'Sin respuesta'}")
    
    # Login
    success, output, _ = exec_cmd(client, "curl -I http://localhost:3000/login 2>&1 | head -1", timeout=10)
    if success and '200' in output:
        print("  ✅ Login: 200 OK")
    else:
        print(f"  ⚠️  Login: {output[:60] if output else 'Sin respuesta'}")
    
    # Ver procesos
    print("\n7️⃣  Procesos activos:")
    success, output, _ = exec_cmd(client, "ps aux | grep node | grep -v grep | head -3", timeout=5)
    for line in output.split('\n')[:3]:
        if line.strip():
            print(f"  {line[:100]}")
    
    # Ver últimos logs
    print("\n8️⃣  Últimos logs (si hay errores):")
    success, output, _ = exec_cmd(client, "tail -10 /tmp/inmova.log", timeout=5)
    if output.strip():
        for line in output.split('\n')[-5:]:
            if line.strip() and ('error' in line.lower() or 'warn' in line.lower()):
                print(f"  {line[:120]}")
    
    print("\n✅ SERVIDOR REINICIADO")
    print("\n📱 Prueba el modal en móvil:")
    print("  http://157.180.119.236/dashboard")
    print("  Login: superadmin@inmova.app / Admin123!")
    print("\n💡 El modal debería:")
    print("  - Ocupar ~95% del ancho en móvil")
    print("  - Tener scroll interno")
    print("  - Botón Cerrar visible y funcional")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
finally:
    client.close()
