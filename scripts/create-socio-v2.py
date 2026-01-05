#!/usr/bin/env python3
"""
Crear usuario socio - versión corregida
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
        # Crear script inline que se ejecuta desde el directorio de la app
        print("🔧 Creando usuario socio...")
        
        command = '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Conectando...');
  
  // Test conexión
  await prisma.\\$queryRaw\\`SELECT 1\\`;
  console.log('✓ Conexión OK');
  
  // Hash password
  const hash = await bcrypt.hash('Ewoorker2025!Socio', 10);
  console.log('✓ Password hasheado');
  
  // Buscar plan
  const plan = await prisma.subscriptionPlan.findFirst();
  console.log('✓ Plan:', plan?.nombre);
  
  // Buscar o crear company
  let company = await prisma.company.findFirst({ where: { nombre: 'Socio Fundador eWoorker' } });
  if (!company) {
    company = await prisma.company.create({
      data: { nombre: 'Socio Fundador eWoorker', cif: 'X00000000X', activo: true, subscriptionPlanId: plan.id }
    });
    console.log('✓ Company CREADA');
  } else {
    console.log('✓ Company existe');
  }
  
  // Crear o actualizar usuario
  const exists = await prisma.user.findUnique({ where: { email: 'socio@ewoorker.com' } });
  if (exists) {
    await prisma.user.update({
      where: { email: 'socio@ewoorker.com' },
      data: { password: hash, role: 'super_admin', activo: true, onboardingCompleted: true, companyId: company.id }
    });
    console.log('✓ Usuario ACTUALIZADO');
  } else {
    await prisma.user.create({
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
    console.log('✓ Usuario CREADO');
  }
  
  // Verificar
  const user = await prisma.user.findUnique({
    where: { email: 'socio@ewoorker.com' },
    select: { email: true, role: true, activo: true }
  });
  console.log('\\n✅ RESULTADO:', JSON.stringify(user));
}

main().catch(e => console.log('ERROR:', e.message)).finally(() => prisma.\\$disconnect());
" 2>&1'''
        
        status, output, error = exec_cmd(client, command, timeout=60)
        print(f"Output:\n{output}")
        if error:
            print(f"Error:\n{error}")
        
        # Verificar en BD directamente
        print("\n📋 Verificación directa en BD...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && sudo -u postgres psql -d inmova_production_v3 -c "SELECT email, role, activo FROM \\"User\\" WHERE email = 'socio@ewoorker.com';" 2>&1'''
        )
        print(f"{output}")
        
        # Test con Playwright
        print("\n🎭 Test con Playwright...")
        playwright_script = '''
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Ir a login
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    console.log('✓ Página login cargada');
    
    // Llenar formulario
    await page.fill('input[name="email"]', 'socio@ewoorker.com');
    await page.fill('input[name="password"]', 'Ewoorker2025!Socio');
    console.log('✓ Formulario llenado');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Esperar navegación
    await page.waitForTimeout(3000);
    
    const url = page.url();
    console.log('✓ URL después de login:', url);
    
    if (url.includes('/dashboard') || url.includes('/admin') || url.includes('/ewoorker')) {
      console.log('✅ LOGIN EXITOSO');
    } else if (url.includes('/login') || url.includes('error')) {
      console.log('❌ LOGIN FALLIDO - redirigido a:', url);
      // Capturar error si existe
      const errorText = await page.locator('.text-red-500, .text-destructive, [role="alert"]').textContent().catch(() => 'No error visible');
      console.log('Error visible:', errorText);
    } else {
      console.log('⚠️ URL inesperada:', url);
    }
    
  } catch (error) {
    console.log('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
'''
        
        # Guardar y ejecutar Playwright test
        status, output, error = exec_cmd(
            client,
            f'''cat > /tmp/test-login.js << 'ENDSCRIPT'
{playwright_script}
ENDSCRIPT
cd /opt/inmova-app && node /tmp/test-login.js 2>&1''',
            timeout=60
        )
        print(f"Playwright result:\n{output}")
        if error:
            print(f"Error:\n{error}")
        
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
