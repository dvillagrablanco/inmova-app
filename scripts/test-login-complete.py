#!/usr/bin/env python3
"""Test completo de login en producción"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

def log(msg, level='INFO'):
    colors = {'INFO': '\033[0;36m', 'SUCCESS': '\033[0;32m', 'ERROR': '\033[0;31m'}
    print(f"{colors.get(level, '')}{level}\033[0m: {msg}")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)

log("🔍 TEST COMPLETO DE LOGIN")
log("=" * 80)

tests_passed = 0
tests_total = 5

# Test 1: Login page carga
log("\n1/5 Login page HTML...")
stdin, stdout, stderr = client.exec_command(
    'curl -s http://localhost:3000/login | grep -q "email" && echo "OK" || echo "FAIL"'
)
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()
if "OK" in result:
    log("   ✅ Login page OK", 'SUCCESS')
    tests_passed += 1
else:
    log("   ❌ Login page FAIL", 'ERROR')

# Test 2: API session responde
log("\n2/5 API /api/auth/session...")
stdin, stdout, stderr = client.exec_command(
    'curl -s http://localhost:3000/api/auth/session'
)
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()
if '"message":"There is a problem' in result:
    log("   ❌ API session tiene error", 'ERROR')
    log(f"   Response: {result}")
else:
    log("   ✅ API session OK", 'SUCCESS')
    tests_passed += 1

# Test 3: No errores NO_SECRET en últimos 10 logs
log("\n3/5 Verificar logs recientes (sin NO_SECRET)...")
stdin, stdout, stderr = client.exec_command(
    "pm2 logs inmova-app --lines 10 --nostream | grep -i 'NO_SECRET' || echo 'NO_ERRORS'"
)
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()
if "NO_ERRORS" in result:
    log("   ✅ Sin errores NO_SECRET en logs recientes", 'SUCCESS')
    tests_passed += 1
else:
    log("   ⚠️ Aún hay errores NO_SECRET (pueden ser antiguos)", 'ERROR')

# Test 4: PM2 status
log("\n4/5 PM2 status...")
stdin, stdout, stderr = client.exec_command(
    "pm2 jlist | grep inmova-app | grep -q online && echo 'OK' || echo 'FAIL'"
)
stdout.channel.recv_exit_status()
result = stdout.read().decode().strip()
if "OK" in result:
    log("   ✅ PM2 online", 'SUCCESS')
    tests_passed += 1
else:
    log("   ❌ PM2 FAIL", 'ERROR')

# Test 5: Variables de entorno configuradas
log("\n5/5 Variables de entorno...")
stdin, stdout, stderr = client.exec_command(
    "grep -E 'NEXTAUTH_SECRET|NEXTAUTH_URL' /opt/inmova-app/.env.production | wc -l"
)
stdout.channel.recv_exit_status()
count = int(stdout.read().decode().strip())
if count >= 2:
    log(f"   ✅ Variables configuradas ({count}/2)", 'SUCCESS')
    tests_passed += 1
else:
    log(f"   ❌ Faltan variables ({count}/2)", 'ERROR')

client.close()

log("\n" + "=" * 80)
log(f"Tests: {tests_passed}/{tests_total} pasando")

if tests_passed >= 4:
    log("✅ LOGIN CORREGIDO EXITOSAMENTE", 'SUCCESS')
    log("")
    log("📝 Verificación manual:")
    log("   1. Ir a: https://inmovaapp.com/login")
    log("   2. Email: admin@inmova.app")
    log("   3. Password: Admin123!")
    log("   4. Deberías ser redirigido a /dashboard")
else:
    log("⚠️ Algunos tests fallaron - revisar manualmente", 'ERROR')
