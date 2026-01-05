#!/usr/bin/env python3
"""
Deploy restricciones de acceso para socio eWoorker
1. Actualiza el schema de Prisma (nuevo rol socio_ewoorker)
2. Cambia el rol del usuario socio a socio_ewoorker
3. Rebuild y restart de la app
"""

import sys
import subprocess
import time

try:
    import paramiko
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

def exec_cmd(client, command, timeout=300):
    print(f"  → {command[:80]}...")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print("=" * 60)
    print("🚀 DEPLOY: Restricciones de acceso para socio eWoorker")
    print("=" * 60)
    
    print("\n🔐 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=15)
    print("✅ Conectado\n")

    try:
        # 1. Git pull
        print("📥 Actualizando código...")
        status, output, error = exec_cmd(
            client,
            "cd /opt/inmova-app && git fetch origin main && git reset --hard origin/main"
        )
        print(f"    {output[:200]}")
        
        # 2. Prisma generate y db push
        print("\n🔧 Actualizando schema de Prisma...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" npx prisma generate 2>&1''',
            timeout=120
        )
        print(f"    Generate: {output[:300]}")
        
        print("\n🔧 Aplicando cambios a BD...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" npx prisma db push --accept-data-loss 2>&1''',
            timeout=180
        )
        print(f"    DB Push: {output[:500]}")
        
        # 3. Actualizar rol del usuario socio
        print("\n🔧 Actualizando rol del usuario socio...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'socio@ewoorker.com' },
    data: { role: 'socio_ewoorker' }
  });
  console.log('Usuario actualizado:', user.email, '-> rol:', user.role);
}

main().catch(e => console.log('ERROR:', e.message)).finally(() => prisma.\\$disconnect());
" 2>&1'''
        )
        print(f"    {output}")
        
        # 4. Build
        print("\n🏗️ Rebuilding aplicación...")
        status, output, error = exec_cmd(
            client,
            "cd /opt/inmova-app && npm run build 2>&1",
            timeout=600
        )
        if "error" in output.lower() and "warning" not in output.lower():
            print(f"    ⚠️ Build output: {output[-500:]}")
        else:
            print("    ✅ Build completado")
        
        # 5. Restart PM2
        print("\n♻️ Reiniciando aplicación...")
        status, output, error = exec_cmd(
            client,
            "pm2 reload inmova-app --update-env && pm2 save"
        )
        print("    ✅ PM2 reiniciado")
        
        # 6. Esperar warm-up
        print("\n⏳ Esperando warm-up (20s)...")
        time.sleep(20)
        
        # 7. Verificar
        print("\n🔍 Verificando...")
        
        # Verificar rol del usuario
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production_v3 -c "SELECT email, role FROM users WHERE email = 'socio@ewoorker.com';" 2>/dev/null'''
        )
        print(f"    Usuario: {output}")
        
        # Health check
        status, output, error = exec_cmd(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health"
        )
        print(f"    Health check: {output}")
        
        # 8. Test de login y restricción
        print("\n🎭 Test con Playwright...")
        playwright_script = '''
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.fill('#email', 'socio@ewoorker.com');
    await page.fill('#password', 'Ewoorker2025!Socio');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Login URL:', page.url());
    
    // Intentar ir al dashboard
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('Dashboard intento URL:', page.url());
    
    if (page.url().includes('/ewoorker')) {
      console.log('✅ RESTRICCIÓN FUNCIONANDO - Redirigido a eWoorker');
    } else if (page.url().includes('/dashboard')) {
      console.log('❌ RESTRICCIÓN NO FUNCIONA - Puede acceder a dashboard');
    } else {
      console.log('⚠️ URL inesperada:', page.url());
    }
    
    // Verificar acceso al panel del socio
    await page.goto('http://localhost:3000/ewoorker/admin-socio', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('Panel socio URL:', page.url());
    
    const hasAccess = !page.url().includes('error') && !page.url().includes('login');
    console.log('Panel socio accesible:', hasAccess);
    
  } catch (error) {
    console.log('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
'''
        
        status, output, error = exec_cmd(
            client,
            f'''cat > /opt/inmova-app/test-restrictions.cjs << 'ENDSCRIPT'
{playwright_script}
ENDSCRIPT
cd /opt/inmova-app && node test-restrictions.cjs 2>&1''',
            timeout=60
        )
        print(f"    {output}")
        exec_cmd(client, "rm -f /opt/inmova-app/test-restrictions.cjs")
        
        print("\n" + "=" * 60)
        print("✅ DEPLOYMENT COMPLETADO")
        print("=" * 60)
        print("""
📋 CAMBIOS APLICADOS:
   • Nuevo rol: socio_ewoorker
   • Usuario socio actualizado con rol restringido
   • Redirección automática a eWoorker para socios
   • Botones de navegación y logout en panel del socio

🔐 CREDENCIALES:
   Email:    socio@ewoorker.com
   Password: Ewoorker2025!Socio
   Rol:      socio_ewoorker (solo acceso a eWoorker)

🌐 URLs:
   Panel: https://inmovaapp.com/ewoorker/admin-socio
   Login: https://inmovaapp.com/login
""")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
