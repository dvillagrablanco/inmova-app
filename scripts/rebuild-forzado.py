#!/usr/bin/env python3
"""Rebuild forzado limpiando todo el caché"""
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
    
    print("🔄 REBUILD FORZADO CON LIMPIEZA TOTAL\n")
    
    # 1. Detener aplicación
    print("1️⃣  Deteniendo aplicación...")
    stdin, stdout, stderr = client.exec_command("pm2 delete inmova-app 2>/dev/null; pm2 kill")
    stdout.channel.recv_exit_status()
    time.sleep(2)
    
    stdin, stdout, stderr = client.exec_command("fuser -k 3000/tcp 2>/dev/null || true")
    stdout.channel.recv_exit_status()
    print("   ✅ Aplicación detenida")
    
    # 2. Limpiar TODO el caché de Next.js
    print("\n2️⃣  Limpiando caché completo...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && rm -rf .next node_modules/.cache .swc"
    )
    stdout.channel.recv_exit_status()
    print("   ✅ Caché eliminado")
    
    # 3. Verificar que el código es correcto
    print("\n3️⃣  Verificando código fuente...")
    stdin, stdout, stderr = client.exec_command(
        f"grep -A3 'isSuperAdmin = session' {APP_DIR}/components/automation/SmartOnboardingWizard.tsx"
    )
    code_check = stdout.read().decode()
    
    if 'return null' in code_check:
        print("   ✅ Código correcto en el servidor")
        print(code_check)
    else:
        print("   ❌ Código incorrecto, falta el return null")
        sys.exit(1)
    
    # 4. Rebuild completo
    print("\n4️⃣  Generando nuevo build (3-5 minutos)...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && npm run build 2>&1 | tail -50",
        timeout=600
    )
    
    build_output = stdout.read().decode()
    print(build_output[-1500:])  # Últimas líneas
    
    exit_code = stdout.channel.recv_exit_status()
    if exit_code != 0:
        print("   ❌ Error en build")
        sys.exit(1)
    
    print("   ✅ Build completado")
    
    # 5. Reiniciar con PM2
    print("\n5️⃣  Reiniciando aplicación...")
    stdin, stdout, stderr = client.exec_command(
        f'cd {APP_DIR} && source .env.production && pm2 start npm --name "inmova-app" -- start',
        timeout=30
    )
    stdout.read()
    print("   ✅ PM2 iniciado")
    
    # 6. Esperar warm-up
    print("\n6️⃣  Esperando warm-up (30s)...")
    time.sleep(30)
    
    # 7. Verificaciones
    print("\n7️⃣  Verificaciones:")
    
    # PM2 online
    stdin, stdout, stderr = client.exec_command("pm2 list | grep inmova-app")
    pm2_status = stdout.read().decode()
    if 'online' in pm2_status:
        print("   ✅ PM2: online")
    else:
        print(f"   ❌ PM2: {pm2_status}")
        sys.exit(1)
    
    # Health check
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
    health = stdout.read().decode()
    if 'connected' in health:
        print("   ✅ API: respondiendo")
    else:
        print(f"   ⚠️  API: {health[:100]}")
    
    # 8. Verificar que el bundle tiene el código correcto
    print("\n8️⃣  Verificando bundle generado...")
    stdin, stdout, stderr = client.exec_command(
        f"grep -r 'super_admin' {APP_DIR}/.next/server/ 2>/dev/null | head -3"
    )
    bundle_check = stdout.read().decode()
    if 'super_admin' in bundle_check:
        print("   ✅ Bundle contiene verificación de super_admin")
    else:
        print("   ⚠️  No se encontró super_admin en el bundle")
    
    # 9. Verificar rol del usuario en BD
    print("\n9️⃣  Verificando rol en base de datos...")
    stdin, stdout, stderr = client.exec_command(
        "psql -U inmova_user -d inmova_production -c \"SELECT email, role FROM users WHERE email='superadmin@inmova.app';\" 2>&1"
    )
    db_check = stdout.read().decode()
    print(db_check)
    
    if 'super_admin' in db_check.lower():
        print("   ✅ Usuario tiene rol super_admin en BD")
    else:
        print("   ⚠️  Rol puede no ser super_admin, revisar")
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ REBUILD COMPLETADO\n")
    print("🌐 URL: https://inmovaapp.com")
    print("🔐 Login: superadmin@inmova.app / Admin123!")
    print("")
    print("⚠️  IMPORTANTE:")
    print("   1. Purga el caché de Cloudflare si lo usas")
    print("   2. Abre en ventana incógnita")
    print("   3. Presiona Ctrl+Shift+R (hard reload)")
    print("")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
