#!/usr/bin/env python3
"""
Test completo del login del socio en el servidor
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
        # Test con Playwright en el servidor
        print("🎭 Ejecutando test con Playwright...")
        
        playwright_script = '''
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Paso 1: Navegando a login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✓ Página cargada:', page.url());
    
    console.log('Paso 2: Llenando formulario...');
    await page.fill('input[name="email"]', 'socio@ewoorker.com');
    await page.fill('input[name="password"]', 'Ewoorker2025!Socio');
    console.log('✓ Credenciales ingresadas');
    
    console.log('Paso 3: Enviando...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    const url = page.url();
    console.log('URL después de login:', url);
    
    if (url.includes('error')) {
      console.log('❌ LOGIN FAILED - Error en URL');
      const errorText = await page.textContent('.text-red-500, .error').catch(() => 'No error text');
      console.log('Error:', errorText);
    } else if (url.includes('/login')) {
      console.log('❌ LOGIN FAILED - Redirigido a login');
    } else {
      console.log('✅ LOGIN SUCCESSFUL');
      
      // Navegar al panel del socio
      console.log('Paso 4: Navegando al panel...');
      await page.goto('http://localhost:3000/ewoorker/admin-socio', { waitUntil: 'networkidle' });
      console.log('Panel URL:', page.url());
      
      if (!page.url().includes('error') && !page.url().includes('/login')) {
        const title = await page.textContent('h1').catch(() => 'No title');
        console.log('✅ PANEL ACCESS OK - Title:', title);
      } else {
        console.log('❌ PANEL ACCESS DENIED');
      }
    }
    
  } catch (error) {
    console.log('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
'''
        
        # Guardar y ejecutar script
        status, output, error = exec_cmd(
            client,
            f'''cat > /opt/inmova-app/test-login.cjs << 'ENDSCRIPT'
{playwright_script}
ENDSCRIPT
cd /opt/inmova-app && node test-login.cjs 2>&1''',
            timeout=60
        )
        print(output)
        if error:
            print(f"Error: {error}")
        
        # Limpiar
        exec_cmd(client, "rm -f /opt/inmova-app/test-login.cjs")
        
        print("\n" + "=" * 60)
        print("📋 RESUMEN DEL TEST")
        print("=" * 60)
        
        if "LOGIN SUCCESSFUL" in output and "PANEL ACCESS OK" in output:
            print("""
✅ TEST PASSED

El login del socio funciona correctamente:
  • Email: socio@ewoorker.com
  • Password: Ewoorker2025!Socio
  • Rol: super_admin
  • Panel: https://inmovaapp.com/ewoorker/admin-socio
""")
        else:
            print("""
❌ TEST FAILED

Revisa los logs arriba para más detalles.
""")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
