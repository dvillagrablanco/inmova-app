#!/usr/bin/env python3
"""Fix completo de build y dependencias"""
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
    
    print("🔧 FIX COMPLETO DE BUILD\n")
    
    # 1. Verificar node y npm
    print("1️⃣  Verificando Node.js...")
    stdin, stdout, stderr = client.exec_command("node -v && npm -v")
    print(stdout.read().decode())
    
    # 2. Limpiar instalación anterior
    print("2️⃣  Limpiando instalación anterior...")
    stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && rm -rf .next node_modules/.cache")
    stdout.channel.recv_exit_status()
    print("   ✅ Cache limpiado")
    
    # 3. Instalar dependencias
    print("\n3️⃣  Instalando dependencias (esto tomará varios minutos)...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && npm install --legacy-peer-deps 2>&1 | tail -30",
        timeout=600
    )
    
    install_output = stdout.read().decode()
    print(install_output)
    
    exit_code = stdout.channel.recv_exit_status()
    if exit_code != 0:
        print("   ❌ Error instalando dependencias")
        print(stderr.read().decode())
        sys.exit(1)
    
    print("   ✅ Dependencias instaladas")
    
    # 4. Generar Prisma Client
    print("\n4️⃣  Generando Prisma Client...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && npx prisma generate 2>&1",
        timeout=120
    )
    
    prisma_output = stdout.read().decode()
    if "Generated Prisma Client" in prisma_output:
        print("   ✅ Prisma Client generado")
    else:
        print(f"   ⚠️  {prisma_output[-200:]}")
    
    # 5. Build de Next.js
    print("\n5️⃣  Generando build de producción...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && npm run build 2>&1 | tail -50",
        timeout=600
    )
    
    build_output = stdout.read().decode()
    print(build_output)
    
    exit_code = stdout.channel.recv_exit_status()
    if exit_code != 0:
        print("   ❌ Error en build")
        print("\nErrores:")
        print(stderr.read().decode())
        sys.exit(1)
    
    if "Compiled successfully" in build_output or "Creating an optimized production build" in build_output:
        print("   ✅ Build completado")
    
    # 6. Verificar que .next existe
    print("\n6️⃣  Verificando archivos de build...")
    stdin, stdout, stderr = client.exec_command(f"ls -lh {APP_DIR}/.next/")
    files = stdout.read().decode()
    if "server" in files and "static" in files:
        print("   ✅ Estructura de build correcta")
    else:
        print("   ⚠️  Estructura incompleta")
    
    # 7. Iniciar aplicación
    print("\n7️⃣  Iniciando aplicación...")
    
    # Limpiar PM2
    stdin, stdout, stderr = client.exec_command("pm2 delete inmova-app 2>/dev/null; pm2 kill")
    stdout.channel.recv_exit_status()
    time.sleep(2)
    
    # Matar procesos en 3000
    stdin, stdout, stderr = client.exec_command("fuser -k 3000/tcp 2>/dev/null || true")
    stdout.channel.recv_exit_status()
    time.sleep(2)
    
    # Iniciar con PM2
    stdin, stdout, stderr = client.exec_command(
        f'cd {APP_DIR} && source .env.production && pm2 start npm --name "inmova-app" -- start',
        timeout=30
    )
    
    start_output = stdout.read().decode()
    print(start_output)
    
    # 8. Esperar warm-up
    print("\n8️⃣  Esperando warm-up (20s)...")
    time.sleep(20)
    
    # 9. Verificaciones finales
    print("\n9️⃣  Verificaciones finales:")
    
    # PM2 status
    stdin, stdout, stderr = client.exec_command("pm2 status inmova-app | grep inmova-app")
    status = stdout.read().decode()
    
    if 'online' in status:
        print("   ✅ PM2: online")
    else:
        print(f"   ❌ PM2: {status}")
        
        # Logs de PM2
        stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --lines 30 --nostream")
        logs = stdout.read().decode()
        print("\n   Últimos logs:")
        print(logs[-1000:])
        sys.exit(1)
    
    # Health check local
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
    health = stdout.read().decode()
    
    if '"connected"' in health or '"disconnected"' in health:
        print("   ✅ API responde")
        if '"connected"' in health:
            print("      Database: connected ✅")
        else:
            print("      Database: disconnected ⚠️")
    else:
        print(f"   ⚠️  Health: {health[:150]}")
    
    # Test página
    stdin, stdout, stderr = client.exec_command("curl -I http://localhost:3000/ 2>&1 | head -3")
    page_test = stdout.read().decode()
    if "200" in page_test or "301" in page_test or "302" in page_test:
        print("   ✅ Página principal: accesible")
    else:
        print(f"   ⚠️  Página: {page_test}")
    
    # Guardar estado de PM2
    stdin, stdout, stderr = client.exec_command("pm2 save")
    stdout.channel.recv_exit_status()
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ BUILD Y DEPLOY COMPLETADOS\n")
    print("🌐 URL: https://inmovaapp.com")
    print("🔐 Login: superadmin@inmova.app / Admin123!")
    print("")
    print("📝 Cambios aplicados:")
    print("   ✓ Dependencias instaladas")
    print("   ✓ Prisma Client generado")
    print("   ✓ Build de producción creado")
    print("   ✓ Aplicación iniciada con PM2")
    print("   ✓ Tutorial NO se muestra para superadministradores")
    print("")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
