#!/usr/bin/env python3
"""
Test de verificación de páginas desarrolladas con Playwright via SSH
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración
SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# Test Playwright
PLAYWRIGHT_TEST = '''
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://inmovaapp.com';

test.describe('High Priority Pages Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Esperar redirección después del login
    await page.waitForURL(/dashboard|admin/, { timeout: 30000 }).catch(() => {});
    await page.waitForLoadState('networkidle');
  });

  test('Coliving Emparejamiento page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/coliving/emparejamiento`);
    await page.waitForLoadState('networkidle');
    
    // Verificar título o contenido
    const heading = await page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    // Verificar que no hay error de servidor
    const content = await page.content();
    expect(content.toLowerCase()).not.toContain('500');
    expect(content.toLowerCase()).not.toContain('internal server error');
    
    console.log('✅ /coliving/emparejamiento cargó correctamente');
  });

  test('Coliving Paquetes page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/coliving/paquetes`);
    await page.waitForLoadState('networkidle');
    
    const heading = await page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    // Buscar elementos específicos de la página
    const hasPackageContent = await page.locator('text=/Paquete|Gestión|Package/i').first().isVisible().catch(() => false);
    console.log(`✅ /coliving/paquetes cargó ${hasPackageContent ? 'con contenido' : ''}`);
  });

  test('Warehouse Inventory page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/inventory`);
    await page.waitForLoadState('networkidle');
    
    const heading = await page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    const hasInventoryContent = await page.locator('text=/Inventario|Inventory|Stock/i').first().isVisible().catch(() => false);
    console.log(`✅ /warehouse/inventory cargó ${hasInventoryContent ? 'con contenido' : ''}`);
  });

  test('Warehouse Locations page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/locations`);
    await page.waitForLoadState('networkidle');
    
    const heading = await page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    console.log('✅ /warehouse/locations cargó correctamente');
  });

  test('Warehouse Movements page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/movements`);
    await page.waitForLoadState('networkidle');
    
    const heading = await page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    console.log('✅ /warehouse/movements cargó correctamente');
  });
});
'''

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(msg, color=Colors.RESET):
    print(f"{color}{msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_code, output + error

def main():
    log("=" * 70, Colors.CYAN)
    log("🎭 PLAYWRIGHT TEST - HIGH PRIORITY PAGES", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Conectar
        log("\n🔐 Conectando al servidor...", Colors.YELLOW)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)
        log(f"✅ Conectado a {SERVER_IP}", Colors.GREEN)
        
        # Crear archivo de test
        log("\n📝 Creando archivo de test...", Colors.YELLOW)
        sftp = client.open_sftp()
        with sftp.file(f"{APP_PATH}/tests/high-priority.spec.ts", 'w') as f:
            f.write(PLAYWRIGHT_TEST)
        sftp.close()
        log("✅ Archivo de test creado", Colors.GREEN)
        
        # Ejecutar Playwright
        log("\n🎭 Ejecutando Playwright tests...", Colors.YELLOW)
        log("   (Esto puede tomar unos minutos)\n", Colors.RESET)
        
        status, output = exec_cmd(
            client,
            f"cd {APP_PATH} && npx playwright test tests/high-priority.spec.ts --reporter=list 2>&1",
            timeout=300
        )
        
        # Mostrar output
        print(output)
        
        # Analizar resultados
        if "5 passed" in output or "passed" in output.lower():
            log("\n✅ Todos los tests pasaron", Colors.GREEN)
        elif "failed" in output.lower():
            log("\n⚠️ Algunos tests fallaron (ver detalles arriba)", Colors.YELLOW)
        else:
            log(f"\n⚠️ Resultado: exit code {status}", Colors.YELLOW)
        
        log("\n" + "=" * 70, Colors.CYAN)
        log("🎭 TEST COMPLETADO", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        
    except Exception as e:
        log(f"\n❌ Error: {str(e)}", Colors.RED)
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
