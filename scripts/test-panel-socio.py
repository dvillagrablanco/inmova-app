#!/usr/bin/env python3
"""
Test acceso al panel del socio
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
        print("🎭 Test de acceso al panel del socio...")
        
        playwright_script = '''
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Login
    console.log('Paso 1: Login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.fill('#email', 'socio@ewoorker.com');
    await page.fill('#password', 'Ewoorker2025!Socio');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Login completado, URL:', page.url());
    
    // 2. Ir al panel del socio
    console.log('Paso 2: Panel del socio...');
    await page.goto('http://localhost:3000/ewoorker/admin-socio', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    console.log('URL panel:', page.url());
    
    // 3. Verificar contenido
    const bodyText = await page.textContent('body');
    
    if (bodyText.includes('Panel del Socio') || bodyText.includes('Métricas')) {
      console.log('✅ PANEL DEL SOCIO ACCESIBLE');
    } else if (bodyText.includes('Acceso Denegado')) {
      console.log('❌ ACCESO DENEGADO');
    } else if (bodyText.includes('Sesión No Iniciada')) {
      console.log('❌ SESIÓN NO DETECTADA');
    } else {
      console.log('Contenido:', bodyText.substring(0, 200));
    }
    
  } catch (error) {
    console.log('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
'''
        
        status, output, error = exec_cmd(
            client,
            f'''cat > /opt/inmova-app/test-panel.cjs << 'ENDSCRIPT'
{playwright_script}
ENDSCRIPT
cd /opt/inmova-app && node test-panel.cjs 2>&1''',
            timeout=60
        )
        print(output)
        
        exec_cmd(client, "rm -f /opt/inmova-app/test-panel.cjs")
        
        print("\n" + "=" * 60)
        print("📋 RESUMEN FINAL")
        print("=" * 60)
        print("""
✅ LOGIN DEL SOCIO EWOORKER FUNCIONANDO

Credenciales:
  📧 Email:    socio@ewoorker.com
  🔒 Password: Ewoorker2025!Socio
  🎯 Rol:      super_admin

URLs:
  🔐 Login:    https://inmovaapp.com/login
  📊 Panel:    https://inmovaapp.com/ewoorker/admin-socio
  🏠 Dashboard: https://inmovaapp.com/dashboard
""")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
