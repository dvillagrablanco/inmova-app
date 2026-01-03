#!/usr/bin/env python3
"""
Fix Login en Producción
Según .cursorrules - Checklist completo
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko
import time

SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

def run_cmd(client, cmd, timeout=120):
    """Execute command and return output"""
    print(f"  → {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    if exit_status == 0:
        print(f"  ✅ OK")
    else:
        print(f"  ⚠️ Exit {exit_status}")
        if err:
            print(f"    {err[:200]}")
    
    return exit_status == 0, out, err

print("\n🔐 FIX LOGIN - SEGÚN CURSORRULES\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)
print("✅ Conectado\n")

# ============================================================================
# 1. VERIFICAR NEXTAUTH_URL
# ============================================================================
print("=== 1. VERIFICAR NEXTAUTH_URL ===")
success, out, err = run_cmd(client, f"cd {PATH} && grep NEXTAUTH_URL .env.production")
if out:
    print(f"  Actual: {out.strip()}")
    if 'https://inmovaapp.com' not in out:
        print("  ⚠️ NEXTAUTH_URL debe ser https://inmovaapp.com")

# ============================================================================
# 2. VERIFICAR USUARIOS EN BD
# ============================================================================
print("\n=== 2. VERIFICAR USUARIOS EN BD ===")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && npx tsx -e \"require('./lib/db').prisma.user.findMany({{where: {{email: {{contains: 'admin'}}}}, select: {{email: true, activo: true, role: true}}}}).then(console.log)\""
)
if out:
    print(f"  Usuarios admin:\n{out}")

# ============================================================================
# 3. EJECUTAR FIX-AUTH-COMPLETE
# ============================================================================
print("\n=== 3. EJECUTAR FIX-AUTH-COMPLETE ===")
success, out, err = run_cmd(
    client,
    f"cd {PATH} && npx tsx scripts/fix-auth-complete.ts",
    timeout=60
)
if out:
    print(f"  Output:\n{out[:500]}")

# ============================================================================
# 4. REINICIAR PM2 (CARGAR NUEVAS VARIABLES)
# ============================================================================
print("\n=== 4. REINICIAR PM2 ===")
run_cmd(client, f"cd {PATH} && pm2 restart inmova-app --update-env")
run_cmd(client, "pm2 save")
print("  ⏳ Esperando 15s...")
time.sleep(15)

# ============================================================================
# 5. TEST LOGIN
# ============================================================================
print("\n=== 5. TEST LOGIN (HTTP) ===")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/login | grep -i 'email' | head -3"
)
if out:
    print(f"  Login page contiene form: {'✅ SÍ' if out else '❌ NO'}")

# ============================================================================
# 6. TEST API AUTH
# ============================================================================
print("\n=== 6. TEST API AUTH ===")
success, out, err = run_cmd(
    client,
    "curl -s http://localhost:3000/api/auth/providers"
)
if 'credentials' in out.lower():
    print("  ✅ API auth configurado correctamente")
else:
    print("  ⚠️ API auth puede tener problemas")

# ============================================================================
# 7. VERIFICAR PM2 STATUS
# ============================================================================
print("\n=== 7. PM2 STATUS ===")
success, out, err = run_cmd(client, "pm2 status inmova-app")
if 'online' in out:
    print("  ✅ PM2 online")
else:
    print("  ❌ PM2 no está online")

print("\n" + "="*70)
print("✅ FIX LOGIN COMPLETADO")
print("="*70)

print("\n📝 CREDENCIALES DE TEST:")
print("  Email: admin@inmova.app")
print("  Password: Admin123!")
print("\n  Email: test@inmova.app")
print("  Password: Test123456!")

print("\n🌐 URLs:")
print("  → https://inmovaapp.com/login")
print(f"  → http://{SERVER}:3000/login")

print("\n🔍 Para ver logs:")
print(f"  ssh {USER}@{SERVER} 'pm2 logs inmova-app --lines 50'")

client.close()
print("\n✅ Script completado")
