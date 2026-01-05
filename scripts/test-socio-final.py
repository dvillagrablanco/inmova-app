#!/usr/bin/env python3
"""
Test final del login del socio con selectores correctos
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
        print("🎭 Ejecutando test con Playwright...")
        
        # Los selectores correctos son #email y #password (por id)
        playwright_script = '''
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Paso 1: Navegando a login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✓ URL:', page.url());
    
    // Esperar a que el formulario cargue
    await page.waitForSelector('#email', { timeout: 10000 });
    console.log('✓ Formulario visible');
    
    console.log('Paso 2: Llenando credenciales...');
    await page.fill('#email', 'socio@ewoorker.com');
    await page.fill('#password', 'Ewoorker2025!Socio');
    console.log('✓ Credenciales ingresadas');
    
    console.log('Paso 3: Enviando formulario...');
    await page.click('button[type="submit"]');
    
    // Esperar a que navegue
    await page.waitForTimeout(5000);
    
    const url = page.url();
    console.log('URL después de login:', url);
    
    // Verificar errores visibles
    const errorVisible = await page.locator('[role="alert"]').isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await page.locator('[role="alert"]').textContent();
      console.log('❌ Error visible:', errorText);
    }
    
    if (url.includes('/dashboard') || url.includes('/admin')) {
      console.log('✅ LOGIN EXITOSO - Redirigido a:', url);
      
      // Navegar al panel del socio
      console.log('Paso 4: Navegando al panel del socio...');
      await page.goto('http://localhost:3000/ewoorker/admin-socio', { waitUntil: 'networkidle' });
      console.log('Panel URL:', page.url());
      
      // Verificar si hay acceso
      const accessDenied = await page.locator('text=Acceso Denegado').isVisible().catch(() => false);
      const panelTitle = await page.locator('text=Panel del Socio').isVisible().catch(() => false);
      
      if (panelTitle) {
        console.log('✅ PANEL ACCESS OK');
      } else if (accessDenied) {
        console.log('❌ PANEL ACCESS DENIED');
      } else {
        console.log('Panel cargado, verificando contenido...');
        const h1 = await page.locator('h1').first().textContent().catch(() => 'No h1');
        console.log('Título:', h1);
      }
      
    } else if (url.includes('/login')) {
      console.log('❌ LOGIN FAILED - Permanece en login');
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
        
        # Guardar y ejecutar
        status, output, error = exec_cmd(
            client,
            f'''cat > /opt/inmova-app/test-login-final.cjs << 'ENDSCRIPT'
{playwright_script}
ENDSCRIPT
cd /opt/inmova-app && node test-login-final.cjs 2>&1''',
            timeout=90
        )
        print(output)
        
        # Limpiar
        exec_cmd(client, "rm -f /opt/inmova-app/test-login-final.cjs")
        
        print("\n" + "=" * 60)
        
        if "LOGIN EXITOSO" in output:
            print("✅ TEST PASSED - Login del socio funciona")
            print("""
📋 CREDENCIALES CONFIRMADAS:
   Email:    socio@ewoorker.com
   Password: Ewoorker2025!Socio
   
🌐 URLs:
   Login: https://inmovaapp.com/login
   Panel: https://inmovaapp.com/ewoorker/admin-socio
""")
        else:
            print("❌ TEST FAILED - Revisar logs arriba")
        
        print("=" * 60)
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
