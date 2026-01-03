#!/usr/bin/env python3
"""
Ver logs de PM2 y regenerar password si es necesario
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
print("🔍 VERIFICAR LOGS Y CREDENCIALES")
print("="*70 + "\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASS, timeout=10)

# 1. Ver logs de PM2 (últimos 100)
print("1. LOGS DE PM2 (últimos intentos de login)")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    "pm2 logs inmova-app --lines 100 --nostream"
)

# Filtrar líneas con NextAuth
lines = (out + err).split('\n')
nextauth_lines = []

for line in lines:
    if any(keyword in line for keyword in ['[NextAuth]', 'authorize', 'Password', 'Usuario', 'Credenciales']):
        nextauth_lines.append(line)

if nextauth_lines:
    print("  Logs de NextAuth encontrados:\n")
    for line in nextauth_lines[-50:]:  # últimas 50 líneas relevantes
        print(f"    {line}")
else:
    print("  ⚠️ No hay logs de NextAuth")
    print("\n  Últimas 30 líneas de logs:\n")
    for line in lines[-30:]:
        if line.strip():
            print(f"    {line}")

# 2. Verificar usuario en BD
print("\n2. VERIFICAR USUARIO EN BD")
print("-"*70 + "\n")

success, out, err = run_cmd(
    client,
    f"""psql {DB_URL} -c "SELECT email, activo, role, LENGTH(password) as pwd_len, LEFT(password, 30) as pwd_start FROM users WHERE email = 'admin@inmova.app';" """
)

print("  Usuario admin@inmova.app:")
print(out)

# 3. Test bcrypt directo
print("3. TEST BCRYPT DIRECTO")
print("-"*70 + "\n")

test_script = """
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@inmova.app' }
    });
    
    if (!user) {
      console.log('❌ Usuario NO encontrado');
      process.exit(1);
    }
    
    console.log('✅ Usuario encontrado:', user.email);
    console.log('  Activo:', user.activo);
    console.log('  Password length:', user.password.length);
    console.log('  Password hash:', user.password.substring(0, 40) + '...');
    
    const testPassword = 'Admin123!';
    console.log('\\n  Testeando password:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log('  Resultado bcrypt.compare:', isValid);
    
    if (isValid) {
      console.log('\\n  ✅✅✅ PASSWORD VÁLIDO ✅✅✅');
    } else {
      console.log('\\n  ❌ PASSWORD INVÁLIDO - Regenerando...');
      
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('\\n  Nuevo hash:', newHash);
      
      await prisma.user.update({
        where: { email: 'admin@inmova.app' },
        data: { 
          password: newHash,
          activo: true 
        }
      });
      
      console.log('  ✅ Password actualizado en BD');
      
      // Test again
      const userUpdated = await prisma.user.findUnique({
        where: { email: 'admin@inmova.app' }
      });
      
      const isValidNow = await bcrypt.compare(testPassword, userUpdated.password);
      console.log('\\n  Test después de actualizar:', isValidNow);
      
      if (isValidNow) {
        console.log('  ✅ Ahora el password es válido');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
"""

run_cmd(
    client,
    f"cd {PATH} && cat > /tmp/test-bcrypt.js << 'EOF'\n{test_script}\nEOF"
)

success, out, err = run_cmd(
    client,
    f"cd {PATH} && export DATABASE_URL='{DB_URL}' && node /tmp/test-bcrypt.js",
    timeout=30
)

print("  Resultado:\n")
for line in (out + err).split('\n'):
    if line.strip():
        print(f"    {line}")

# 4. Si se actualizó el password, restart PM2
if 'Password actualizado' in out or 'Regenerando' in out:
    print("\n4. RESTART PM2 (password actualizado)")
    print("-"*70 + "\n")
    
    run_cmd(client, "pm2 restart inmova-app --update-env")
    print("  ✅ PM2 restarted")
    print("  ⏳ Esperando warm-up (10s)...\n")
    time.sleep(10)

# RESUMEN
print("\n" + "="*70)
print("RESUMEN")
print("="*70 + "\n")

if 'PASSWORD VÁLIDO' in out:
    print("✅ Password en BD es correcto\n")
    print("Posibles causas del error 'Credenciales inválidas':")
    print("  1. Formulario envía email/password con espacios extra")
    print("  2. Campo email tiene mayúsculas (debe ser lowercase)")
    print("  3. Error en el frontend al enviar datos")
    print("  4. Revisar logs de PM2 arriba para ver exactamente qué recibió authorize()\n")
    
    print("Solución:")
    print("  - Intentar login nuevamente")
    print("  - O usar email: admin@inmova.app (todo lowercase)")
    print("  - O crear nuevo usuario de test\n")
    
elif 'Password actualizado' in out:
    print("✅ Password regenerado exitosamente\n")
    print("INTENTAR LOGIN NUEVAMENTE:")
    print("  URL: https://inmovaapp.com/login")
    print("  Email: admin@inmova.app")
    print("  Password: Admin123!\n")
    print("  (Copiar y pegar exactamente, sin espacios)\n")
else:
    print("⚠️ Revisar logs arriba para diagnosticar\n")

print("="*70 + "\n")

client.close()
