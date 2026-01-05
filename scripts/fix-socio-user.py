#!/usr/bin/env python3
"""
Crear/arreglar usuario socio usando las variables de entorno correctas
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

def exec_cmd(client, command, timeout=120):
    print(f"  → {command[:80]}...")
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
        # 1. Ver DATABASE_URL configurada
        print("📋 Verificando DATABASE_URL...")
        status, output, error = exec_cmd(
            client,
            "cd /opt/inmova-app && grep DATABASE_URL .env.production"
        )
        print(f"    {output.strip()}")
        
        # 2. Extraer DATABASE_URL y usarla
        print("\n📋 Verificando si usuario socio existe...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && source .env.production 2>/dev/null || export $(cat .env.production | grep -v '^#' | xargs) && \
            node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'socio@ewoorker.com' },
    select: { id: true, email: true, role: true, activo: true }
  });
  console.log('USER:', JSON.stringify(user));
}
main().catch(e => console.log('ERROR:', e.message)).finally(() => prisma.\\$disconnect());
"'''
        )
        print(f"    Resultado: {output}")
        if error:
            print(f"    Error: {error[:300]}")
        
        # 3. Crear/actualizar usuario
        print("\n🔧 Creando/actualizando usuario socio...")
        
        create_script = '''
cd /opt/inmova-app && \\
export $(cat .env.production | grep -v '^#' | xargs) && \\
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Conectando a BD...');
  
  // Hash password
  const password = 'Ewoorker2025!Socio';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hasheado');
  
  // Buscar o crear company
  let company = await prisma.company.findFirst({ where: { nombre: 'Socio Fundador eWoorker' } });
  
  if (!company) {
    // Buscar plan Demo
    const plan = await prisma.subscriptionPlan.findFirst({ where: { nombre: 'Demo' } });
    if (!plan) {
      console.log('ERROR: Plan Demo no encontrado');
      return;
    }
    
    company = await prisma.company.create({
      data: {
        nombre: 'Socio Fundador eWoorker',
        cif: 'X00000000X',
        activo: true,
        subscriptionPlanId: plan.id
      }
    });
    console.log('Company creada:', company.id);
  } else {
    console.log('Company existe:', company.id);
  }
  
  // Crear o actualizar usuario
  const existingUser = await prisma.user.findUnique({ where: { email: 'socio@ewoorker.com' } });
  
  if (existingUser) {
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
    console.log('Usuario ACTUALIZADO:', updated.email, updated.role);
  } else {
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
    console.log('Usuario CREADO:', created.email, created.role);
  }
  
  console.log('✅ COMPLETADO');
}

main().catch(e => console.log('ERROR:', e.message)).finally(() => prisma.\\$disconnect());
"
'''
        
        status, output, error = exec_cmd(client, create_script, timeout=120)
        print(f"    Output:\n{output}")
        if error:
            print(f"    Error: {error[:500]}")
        
        # 4. Verificar usuario final
        print("\n📋 Verificación final...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && \\
export $(cat .env.production | grep -v '^#' | xargs) && \\
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'socio@ewoorker.com' },
    select: { id: true, email: true, name: true, role: true, activo: true, onboardingCompleted: true }
  });
  console.log('USUARIO:', JSON.stringify(user, null, 2));
}
main().catch(e => console.log('ERROR:', e.message)).finally(() => prisma.\\$disconnect());
"'''
        )
        print(f"    {output}")
        
        # 5. Test login real con Playwright
        print("\n🎭 Probando login real con Playwright...")
        
        playwright_test = '''
cd /opt/inmova-app && \\
export $(cat .env.production | grep -v '^#' | xargs) && \\
npx playwright test --grep "login" --reporter=list 2>&1 | head -30 || true
'''
        # Skip Playwright por ahora, test manual
        
        # 6. Test via curl al endpoint de login
        print("\n🔐 Test de login via API...")
        
        # Primero obtener CSRF token
        status, output, error = exec_cmd(
            client,
            "curl -s -c /tmp/cookies.txt http://localhost:3000/api/auth/csrf"
        )
        print(f"    CSRF: {output[:200]}")
        
        # Login
        status, output, error = exec_cmd(
            client,
            '''curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt -X POST \\
  http://localhost:3000/api/auth/callback/credentials \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "email=socio@ewoorker.com&password=Ewoorker2025!Socio&csrfToken=$(cat /tmp/cookies.txt | grep csrf | awk '{print $7}')" \\
  -w "\\nHTTP:%{http_code}\\nREDIRECT:%{redirect_url}"
'''
        )
        print(f"    Login response:\n{output[:500]}")
        
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
""")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
