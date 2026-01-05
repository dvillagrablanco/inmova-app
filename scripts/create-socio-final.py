#!/usr/bin/env python3
"""
Crear usuario socio usando DATABASE_URL correcto
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

# DATABASE_URL real de PM2
REAL_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/inmova_production_v3"

def exec_cmd(client, command, timeout=120):
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
        # 1. Crear script Node.js en servidor
        print("📋 Creando script para usuario socio...")
        
        node_script = '''
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Forzar DATABASE_URL correcto
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/inmova_production_v3';

const prisma = new PrismaClient();

async function main() {
  console.log('Conectando a BD...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
  
  try {
    // Test conexión
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Conexión OK');
    
    // Hash password
    const password = 'Ewoorker2025!Socio';
    const hash = await bcrypt.hash(password, 10);
    console.log('✓ Password hasheado');
    
    // Buscar plan de suscripción
    const plan = await prisma.subscriptionPlan.findFirst();
    if (!plan) {
      console.log('ERROR: No hay planes de suscripción');
      return;
    }
    console.log('✓ Plan encontrado:', plan.nombre);
    
    // Buscar o crear company
    let company = await prisma.company.findFirst({ 
      where: { nombre: 'Socio Fundador eWoorker' } 
    });
    
    if (!company) {
      company = await prisma.company.create({
        data: {
          nombre: 'Socio Fundador eWoorker',
          cif: 'X00000000X',
          activo: true,
          subscriptionPlanId: plan.id
        }
      });
      console.log('✓ Company CREADA:', company.id);
    } else {
      console.log('✓ Company existe:', company.id);
    }
    
    // Buscar usuario
    const existingUser = await prisma.user.findUnique({ 
      where: { email: 'socio@ewoorker.com' } 
    });
    
    if (existingUser) {
      // Actualizar
      const updated = await prisma.user.update({
        where: { email: 'socio@ewoorker.com' },
        data: {
          password: hash,
          role: 'super_admin',
          activo: true,
          onboardingCompleted: true,
          companyId: company.id
        }
      });
      console.log('✓ Usuario ACTUALIZADO:', updated.email, updated.role);
    } else {
      // Crear
      const created = await prisma.user.create({
        data: {
          email: 'socio@ewoorker.com',
          name: 'Socio Fundador eWoorker',
          password: hash,
          role: 'super_admin',
          activo: true,
          emailVerified: new Date(),
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          companyId: company.id
        }
      });
      console.log('✓ Usuario CREADO:', created.email, created.role);
    }
    
    // Verificar
    const user = await prisma.user.findUnique({
      where: { email: 'socio@ewoorker.com' },
      select: { id: true, email: true, name: true, role: true, activo: true }
    });
    console.log('\\n✅ USUARIO FINAL:', JSON.stringify(user, null, 2));
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
'''
        
        # Guardar script en servidor
        status, output, error = exec_cmd(
            client,
            f'''cat > /tmp/create-socio.js << 'ENDOFSCRIPT'
{node_script}
ENDOFSCRIPT
'''
        )
        
        # Ejecutar script
        print("🔧 Ejecutando script...")
        status, output, error = exec_cmd(
            client,
            "cd /opt/inmova-app && node /tmp/create-socio.js 2>&1",
            timeout=60
        )
        print(f"Output:\n{output}")
        if error:
            print(f"Error:\n{error}")
        
        # Verificar en BD
        print("\n📋 Verificación en BD...")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production_v3 -c "SELECT email, role, activo FROM \\"User\\" WHERE email = 'socio@ewoorker.com';" 2>/dev/null'''
        )
        print(f"{output}")
        
        # Test login via API
        print("\n🔐 Probando login...")
        
        # Obtener CSRF
        status, csrf_output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/auth/csrf"
        )
        
        # Extraer token
        import json
        try:
            csrf_data = json.loads(csrf_output)
            csrf_token = csrf_data.get('csrfToken', '')
            print(f"CSRF Token: {csrf_token[:20]}...")
        except:
            csrf_token = ''
            print("No se pudo obtener CSRF token")
        
        # Login
        if csrf_token:
            status, output, error = exec_cmd(
                client,
                f'''curl -s -X POST http://localhost:3000/api/auth/callback/credentials \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "email=socio@ewoorker.com&password=Ewoorker2025!Socio&csrfToken={csrf_token}" \\
  -w "\\nHTTP:%{{http_code}}"
'''
            )
            print(f"Login response: {output[:300]}")
        
        print("\n" + "=" * 60)
        print("✅ PROCESO COMPLETADO")
        print("=" * 60)
        print("""
🔐 CREDENCIALES DEL SOCIO:
   Email:    socio@ewoorker.com
   Password: Ewoorker2025!Socio
   
🌐 URLs:
   Login:    https://inmovaapp.com/login
   Panel:    https://inmovaapp.com/ewoorker/admin-socio
   
⚠️  Prueba el login manualmente en el navegador
""")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
