#!/usr/bin/env python3
"""Verificar rol de usuario y purgar caché"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🔍 VERIFICACIÓN FINAL\n")
    
    # 1. Verificar rol del usuario en BD (con conexión correcta)
    print("1️⃣  Verificando rol de superadministrador en BD...")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && node -e \""
        "require('dotenv').config({path:'.env.production'}); "
        "const {{ PrismaClient }} = require('@prisma/client'); "
        "const prisma = new PrismaClient(); "
        "prisma.user.findUnique({{ "
        "where: {{ email: 'superadmin@inmova.app' }}, "
        "select: {{ email: true, role: true, name: true }} "
        "}}).then(user => {{ "
        "console.log('Usuario:', JSON.stringify(user, null, 2)); "
        "process.exit(0); "
        "}}).catch(e => {{ console.error('Error:', e.message); process.exit(1); }});"
        "\"",
        timeout=30
    )
    
    db_output = stdout.read().decode()
    print(db_output)
    
    if '"role":' in db_output:
        if '"super_admin"' in db_output or '"SUPER_ADMIN"' in db_output:
            print("   ✅ Usuario tiene rol super_admin")
        else:
            print("   ⚠️  Usuario NO tiene rol super_admin")
            print("   Actualizando rol...")
            
            # Actualizar rol a super_admin
            stdin, stdout, stderr = client.exec_command(
                f"cd {APP_DIR} && node -e \""
                "require('dotenv').config({path:'.env.production'}); "
                "const {{ PrismaClient }} = require('@prisma/client'); "
                "const prisma = new PrismaClient(); "
                "prisma.user.update({{ "
                "where: {{ email: 'superadmin@inmova.app' }}, "
                "data: {{ role: 'super_admin' }} "
                "}}).then(user => {{ "
                "console.log('Rol actualizado:', user.role); "
                "process.exit(0); "
                "}}).catch(e => {{ console.error('Error:', e.message); process.exit(1); }});"
                "\"",
                timeout=30
            )
            
            update_output = stdout.read().decode()
            print(update_output)
    
    # 2. Ver esquema del enum de roles
    print("\n2️⃣  Verificando valores posibles de role...")
    stdin, stdout, stderr = client.exec_command(
        f"grep -A10 'enum.*Role' {APP_DIR}/prisma/schema.prisma 2>&1"
    )
    schema_output = stdout.read().decode()
    print(schema_output)
    
    # 3. Test de login real con Playwright
    print("\n3️⃣  Test de login con Playwright...")
    
    # Crear script de test temporal
    test_script = """
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://inmovaapp.com/login');
    await page.fill('input[name="email"]', 'superadmin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000);
    
    // Verificar modal
    const modalCount = await page.locator('[role="dialog"]').count();
    const tutorialCount = await page.locator('text=/tutorial/i').count();
    
    console.log('Modal visible:', modalCount > 0 ? 'SÍ ❌' : 'NO ✅');
    console.log('Texto tutorial:', tutorialCount > 0 ? 'SÍ ❌' : 'NO ✅');
    
    // Captura
    await page.screenshot({ path: '/tmp/test-final.png' });
    
    if (modalCount === 0 && tutorialCount === 0) {
      console.log('\\n✅ TEST EXITOSO: Tutorial NO aparece');
      process.exit(0);
    } else {
      console.log('\\n❌ TEST FALLIDO: Tutorial aparece');
      process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
"""
    
    # Subir y ejecutar test
    stdin, stdout, stderr = client.exec_command(f"cat > /tmp/test-tutorial.ts << 'EOF'\n{test_script}\nEOF")
    stdout.channel.recv_exit_status()
    
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && npx tsx /tmp/test-tutorial.ts 2>&1",
        timeout=60
    )
    
    test_output = stdout.read().decode()
    print(test_output)
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("📋 INSTRUCCIONES FINALES:\n")
    print("1️⃣  Purga el caché de Cloudflare:")
    print("   - Ve a dashboard de Cloudflare")
    print("   - Caching > Configuration")
    print("   - Purge Everything")
    print("")
    print("2️⃣  En tu navegador:")
    print("   - Abre ventana incógnita")
    print("   - Ve a https://inmovaapp.com")
    print("   - Login con superadmin@inmova.app")
    print("   - Hard reload: Ctrl+Shift+R (o Cmd+Shift+R en Mac)")
    print("")
    print("3️⃣  Si sigue apareciendo:")
    print("   - Limpia cookies del sitio")
    print("   - Cierra todas las pestañas del dominio")
    print("   - Vuelve a abrir en incógnito")
    print("")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
