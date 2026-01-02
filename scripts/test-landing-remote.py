#!/usr/bin/env python3
"""
Script para ejecutar test Playwright en servidor remoto
Detecta problemas visuales y errores JavaScript
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'

# Script Node.js inline para ejecutar en servidor
PLAYWRIGHT_TEST = """
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const consoleErrors = [];
  const pageErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  try {
    console.log('Navegando a landing...');
    await page.goto('http://localhost:3000/landing', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Verificar contenido
    const checks = [
      'INMOVA',
      '6 Verticales',
      'Empezar Gratis',
      'Starter',
      'Professional'
    ];
    
    console.log('\\nVerificando contenido:');
    for (const text of checks) {
      try {
        const element = await page.locator(`text=${text}`).first();
        const visible = await element.isVisible({ timeout: 2000 });
        console.log(`  ${visible ? '✅' : '❌'} ${text}`);
      } catch (e) {
        console.log(`  ❌ ${text} (no encontrado)`);
      }
    }
    
    // Contar elementos
    const bodyText = await page.locator('body').textContent();
    const divCount = await page.locator('div').count();
    const buttonCount = await page.locator('button').count();
    
    console.log(`\\nEstadísticas:`);
    console.log(`  Texto: ${bodyText.length} chars`);
    console.log(`  Divs: ${divCount}`);
    console.log(`  Buttons: ${buttonCount}`);
    console.log(`  Console errors: ${consoleErrors.length}`);
    console.log(`  Page errors: ${pageErrors.length}`);
    
    if (pageErrors.length > 0) {
      console.log('\\n❌ ERRORES:');
      pageErrors.slice(0, 3).forEach(err => console.log(`  ${err}`));
    }
    
    if (bodyText.length < 100) {
      console.log('\\n❌ PÁGINA EN BLANCO');
    } else {
      console.log('\\n✅ Contenido presente');
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();
"""

def run_remote_test():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔌 Conectando al servidor...")
        ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        print("📦 Verificando Playwright...")
        stdin, stdout, stderr = ssh.exec_command("which playwright || echo 'NOT_FOUND'")
        stdout.channel.recv_exit_status()
        result = stdout.read().decode().strip()
        
        if 'NOT_FOUND' in result:
            print("❌ Playwright no instalado en servidor")
            print("Instalando Playwright...")
            stdin, stdout, stderr = ssh.exec_command(
                "cd /home/deploy/inmova-app && npm install -D playwright && npx playwright install chromium",
                timeout=180
            )
            stdout.channel.recv_exit_status()
            print("✅ Playwright instalado")
        
        print("\n🎭 Ejecutando test Playwright...")
        print("="*60)
        
        # Escribir script temporal
        write_cmd = f"cat > /tmp/test-landing.js << 'EOFSCRIPT'\n{PLAYWRIGHT_TEST}\nEOFSCRIPT"
        ssh.exec_command(write_cmd)
        time.sleep(1)
        
        # Ejecutar test
        stdin, stdout, stderr = ssh.exec_command(
            "cd /home/deploy/inmova-app && node /tmp/test-landing.js",
            timeout=60
        )
        stdout.channel.recv_exit_status()
        
        output = stdout.read().decode()
        errors = stderr.read().decode()
        
        print(output)
        if errors:
            print("\n⚠️ STDERR:")
            print(errors)
        
        print("="*60)
        
        # Limpiar
        ssh.exec_command("rm -f /tmp/test-landing.js")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    run_remote_test()
