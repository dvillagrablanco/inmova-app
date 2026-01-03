#!/usr/bin/env python3
"""
Test Login Profundo - Ver qué está fallando exactamente
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

DB_URL = "postgresql://inmova_user:inmova123@localhost:5432/inmova_production"

def run_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🔍 TEST LOGIN PROFUNDO")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. VERIFICAR PASSWORD HASH
print("1. VERIFICAR PASSWORD DE admin@inmova.app")
print("="*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""cd {PATH} && export DATABASE_URL='{DB_URL}' && node -e "
const bcrypt = require('bcryptjs');
const password = 'Admin123!';

// Test con el hash que debería estar en BD
bcrypt.compare(password, '\\$2a\\$10\\$oa6cLkJYnfgfAiTICydDqujwHq7.EODb1uHC.QYBbTye9jC1chppC').then(result => {{
  console.log('Password válido:', result);
  if (!result) {{
    // Generar nuevo hash
    bcrypt.hash(password, 10).then(newHash => {{
      console.log('Nuevo hash:', newHash);
    }});
  }}
}});
" """
)

print(f"  Resultado: {out}")

# 2. VER LOGS DE AUTH EN TIEMPO REAL
print("\n2. LOGS AUTH EN TIEMPO REAL")
print("="*70 + "\n")

print("  Limpiando logs anteriores...")
run_cmd(client, "pm2 flush inmova-app")
time.sleep(2)

print("  Haciendo login request...")

# Obtener CSRF
success, out, err = run_cmd(
    client,
    "curl -s -c /tmp/test-cookies.txt http://localhost:3000/api/auth/csrf"
)

csrf_token = None
try:
    import json
    csrf = json.loads(out)
    csrf_token = csrf.get('csrfToken')
    print(f"  CSRF: {csrf_token[:20]}...\n")
except:
    print("  ⚠️ No CSRF\n")

if csrf_token:
    # Login request
    login_cmd = f"""curl -v -X POST http://localhost:3000/api/auth/callback/credentials \
-H 'Content-Type: application/x-www-form-urlencoded' \
-b /tmp/test-cookies.txt \
-d 'email=admin@inmova.app&password=Admin123!&csrfToken={csrf_token}&callbackUrl=/dashboard&json=true' \
2>&1"""
    
    success, out, err = run_cmd(client, login_cmd)
    
    print("  Response headers:")
    for line in out.split('\n'):
        if 'Location:' in line or 'Set-Cookie:' in line or 'HTTP/' in line:
            print(f"    {line}")
    
    print("\n  Response body:")
    # Body está después de headers vacíos
    body_started = False
    for line in out.split('\n'):
        if body_started:
            print(f"    {line}")
        if line.strip() == '':
            body_started = True

# 3. VER LOGS PM2 INMEDIATAMENTE
print("\n3. LOGS PM2 (POST-LOGIN)")
print("="*70 + "\n")

time.sleep(2)

success, out, err = run_cmd(client, "pm2 logs inmova-app --nostream --lines 30")

print("  Logs stdout:")
for line in out.split('\n'):
    if 'POST' in line or 'auth' in line.lower() or 'credentials' in line.lower():
        print(f"    → {line}")
    elif 'error' in line.lower():
        print(f"    ❌ {line}")

print("\n  Logs stderr:")
success, out, err = run_cmd(client, "pm2 logs inmova-app --err --nostream --lines 20")
for line in out.split('\n')[-20:]:
    if line.strip() and ('error' in line.lower() or 'auth' in line.lower() or 'prisma' in line.lower()):
        print(f"    ❌ {line}")

# 4. TEST BCRYPT DIRECTO
print("\n4. TEST BCRYPT DIRECTO")
print("="*70 + "\n")

print("  Testeando bcrypt comparison...")

test_script = """
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@inmova.app' },
    select: { email: true, password: true, activo: true }
  });
  
  console.log('User:', user.email);
  console.log('Activo:', user.activo);
  console.log('Password hash length:', user.password.length);
  
  const testPassword = 'Admin123!';
  const isValid = await bcrypt.compare(testPassword, user.password);
  
  console.log('Password test result:', isValid);
  
  if (!isValid) {
    console.log('PROBLEMA: Password no coincide');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('Nuevo hash generado:', newHash);
    
    // Actualizar en BD
    await prisma.user.update({
      where: { email: 'admin@inmova.app' },
      data: { password: newHash }
    });
    console.log('Password actualizado en BD');
  } else {
    console.log('OK: Password válido');
  }
  
  await prisma.$disconnect();
}

test();
"""

run_cmd(
    client,
    f"cd {PATH} && cat > /tmp/test-bcrypt.js << 'EOF'\n{test_script}\nEOF"
)

success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && node /tmp/test-bcrypt.js"
)

print("  Resultado:")
for line in out.split('\n'):
    if line.strip():
        print(f"    {line}")

# 5. TEST LOGIN POST-FIX
print("\n5. TEST LOGIN POST-FIX (SI SE ACTUALIZÓ PASSWORD)")
print("="*70 + "\n")

time.sleep(2)

# Obtener nuevo CSRF
success, out, err = run_cmd(
    client,
    "curl -s -c /tmp/test-cookies2.txt http://localhost:3000/api/auth/csrf"
)

try:
    csrf = json.loads(out)
    csrf_token = csrf.get('csrfToken')
    
    if csrf_token:
        print(f"  CSRF obtenido: {csrf_token[:20]}...")
        
        # Nuevo login
        login_cmd = f"""curl -s -L -X POST http://localhost:3000/api/auth/callback/credentials \
-H 'Content-Type: application/x-www-form-urlencoded' \
-b /tmp/test-cookies2.txt -c /tmp/test-cookies3.txt \
-d 'email=admin@inmova.app&password=Admin123!&csrfToken={csrf_token}&callbackUrl=/dashboard' \
-w '\\nHTTP:%{{http_code}}'"""
        
        success, out, err = run_cmd(client, login_cmd)
        
        if 'HTTP:' in out:
            parts = out.split('HTTP:')
            response = parts[0]
            code = parts[1].strip() if len(parts) > 1 else 'unknown'
            
            print(f"  HTTP Code: {code}")
            
            if '200' in code or '302' in code or '307' in code:
                print("  ✅ Login response OK")
                
                # Verificar sesión
                success, out, err = run_cmd(
                    client,
                    "curl -s -b /tmp/test-cookies3.txt http://localhost:3000/api/auth/session"
                )
                
                if 'user' in out.lower() or 'email' in out.lower():
                    print("  ✅✅✅ SESIÓN CREADA CORRECTAMENTE ✅✅✅")
                    print(f"  Session data: {out[:200]}")
                else:
                    print("  ⚠️ No hay sesión aún")
                    print(f"  Response: {out}")
            else:
                print(f"  ⚠️ Login response: {code}")
                print(f"  Body: {response[:300]}")
except Exception as e:
    print(f"  Error: {e}")

# RESUMEN
print("\n" + "="*70)
print("RESUMEN")
print("="*70 + "\n")

print("Verificaciones:")
print("  1. Password hash testeado con bcrypt")
print("  2. Logs de auth revisados")
print("  3. Test de login ejecutado")
print("  4. Sesión verificada\n")

print("Si password fue actualizado, el login debería funcionar ahora.\n")

client.close()
