#!/usr/bin/env python3
"""
Test login del socio eWoorker y verificar en BD
"""

import sys
import subprocess

try:
    import paramiko
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

def exec_cmd(client, command, timeout=60):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print("🔐 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=15)
    print("✅ Conectado\n")

    try:
        # 1. Verificar si el usuario socio existe
        print("=" * 60)
        print("📋 VERIFICANDO USUARIO SOCIO EN BASE DE DATOS")
        print("=" * 60)
        
        query = '''
        SELECT id, email, name, role, activo, "onboardingCompleted", "companyId"
        FROM "User" 
        WHERE email = 'socio@ewoorker.com';
        '''
        
        status, output, error = exec_cmd(
            client,
            f'''cd /opt/inmova-app && psql -U inmova_user -d inmova_production -t -c "{query}"'''
        )
        
        print(f"Resultado BD:\n{output}")
        if error:
            print(f"Error BD: {error}")
        
        if not output.strip() or 'row' not in output.lower():
            print("\n⚠️ USUARIO NO ENCONTRADO EN BD")
            print("\n🔧 Creando usuario socio...")
            
            # Ejecutar script para crear usuario
            status, output, error = exec_cmd(
                client,
                "cd /opt/inmova-app && npx tsx scripts/create-ewoorker-partner-user.ts 2>&1",
                timeout=120
            )
            print(f"Output:\n{output[:2000]}")
            if error:
                print(f"Error:\n{error[:500]}")
        else:
            print("✅ Usuario encontrado en BD")
            
            # Verificar que el password hash es correcto
            print("\n📋 Verificando hash de password...")
            hash_query = '''SELECT password FROM "User" WHERE email = 'socio@ewoorker.com';'''
            status, output, error = exec_cmd(
                client,
                f'''cd /opt/inmova-app && psql -U inmova_user -d inmova_production -t -c "{hash_query}"'''
            )
            hash_value = output.strip()
            print(f"Hash actual: {hash_value[:30]}...")
            
            # Actualizar password
            print("\n🔧 Actualizando password del socio...")
            update_script = '''
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const password = 'Ewoorker2025!Socio';
  const hash = await bcrypt.hash(password, 10);
  console.log('Nuevo hash:', hash);
  
  const user = await prisma.user.update({
    where: { email: 'socio@ewoorker.com' },
    data: { 
      password: hash,
      activo: true,
      role: 'super_admin',
      onboardingCompleted: true
    }
  });
  console.log('Usuario actualizado:', user.email, user.role, user.activo);
}

main().catch(console.error).finally(() => prisma.$disconnect());
'''
            
            # Guardar y ejecutar script
            status, output, error = exec_cmd(
                client,
                f'''cat > /tmp/update-socio.js << 'EOFSCRIPT'
{update_script}
EOFSCRIPT
cd /opt/inmova-app && node /tmp/update-socio.js 2>&1''',
                timeout=60
            )
            print(f"Resultado update:\n{output}")
            if error:
                print(f"Error: {error}")
        
        # 2. Test login via API
        print("\n" + "=" * 60)
        print("🔐 PROBANDO LOGIN VIA API")
        print("=" * 60)
        
        login_cmd = '''
curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=socio@ewoorker.com&password=Ewoorker2025!Socio&csrfToken=test&callbackUrl=/ewoorker/admin-socio" \
  -w "\\nHTTP_CODE:%{http_code}"
'''
        status, output, error = exec_cmd(client, login_cmd)
        print(f"Respuesta API:\n{output[:1000]}")
        
        # 3. Test session
        print("\n📋 Verificando session API...")
        status, output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/auth/session"
        )
        print(f"Session: {output[:500]}")
        
        # 4. Verificar usuario final
        print("\n" + "=" * 60)
        print("📋 VERIFICACIÓN FINAL DEL USUARIO")
        print("=" * 60)
        
        verify_query = '''
        SELECT email, role, activo, "onboardingCompleted" 
        FROM "User" 
        WHERE email = 'socio@ewoorker.com';
        '''
        status, output, error = exec_cmd(
            client,
            f'''cd /opt/inmova-app && psql -U inmova_user -d inmova_production -c "{verify_query}"'''
        )
        print(output)
        
        print("\n" + "=" * 60)
        print("✅ VERIFICACIÓN COMPLETA")
        print("=" * 60)
        print("""
Credenciales del socio:
  📧 Email: socio@ewoorker.com
  🔒 Password: Ewoorker2025!Socio
  🔗 Login: https://inmovaapp.com/login
  🎯 Panel: https://inmovaapp.com/ewoorker/admin-socio
""")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
