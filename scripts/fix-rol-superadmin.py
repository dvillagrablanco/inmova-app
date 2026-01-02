#!/usr/bin/env python3
"""Verificar y actualizar rol de superadmin"""
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
    
    print("🔧 VERIFICACIÓN Y ACTUALIZACIÓN DE ROL\n")
    
    # 1. Crear script Node.js para verificar/actualizar
    update_script = """
require('dotenv').config({path:'.env.production'});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndUpdateRole() {
  try {
    console.log('1️⃣  Buscando usuario superadmin@inmova.app...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@inmova.app' },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (!user) {
      console.log('   ❌ Usuario NO encontrado');
      process.exit(1);
    }
    
    console.log('   ✅ Usuario encontrado');
    console.log('   Email:', user.email);
    console.log('   Nombre:', user.name);
    console.log('   Rol actual:', user.role);
    
    if (user.role !== 'super_admin') {
      console.log('\\n2️⃣  Rol incorrecto, actualizando a super_admin...');
      
      const updated = await prisma.user.update({
        where: { email: 'superadmin@inmova.app' },
        data: { role: 'super_admin' }
      });
      
      console.log('   ✅ Rol actualizado a:', updated.role);
    } else {
      console.log('\\n   ✅ Rol ya es super_admin, no requiere cambios');
    }
    
    // Verificar todos los usuarios y sus roles
    console.log('\\n3️⃣  Lista de usuarios y roles:');
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true },
      take: 10
    });
    
    allUsers.forEach(u => {
      console.log(`   - ${u.email}: ${u.role}`);
    });
    
    await prisma.$disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndUpdateRole();
"""
    
    # Subir script
    stdin, stdout, stderr = client.exec_command(
        f"cat > {APP_DIR}/check-role.js << 'EOFSCRIPT'\n{update_script}\nEOFSCRIPT"
    )
    stdout.channel.recv_exit_status()
    
    # Ejecutar script
    print("Ejecutando verificación de rol...\n")
    stdin, stdout, stderr = client.exec_command(
        f"cd {APP_DIR} && node check-role.js 2>&1",
        timeout=30
    )
    
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    print(output)
    if error:
        print("Errores:", error)
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("✅ VERIFICACIÓN COMPLETADA\n")
        
        # Reiniciar PM2 para asegurar que toma los cambios
        print("🔄 Reiniciando PM2...")
        stdin, stdout, stderr = client.exec_command("pm2 restart inmova-app")
        stdout.channel.recv_exit_status()
        print("   ✅ PM2 reiniciado")
        
        print("\n📋 PRÓXIMOS PASOS:\n")
        print("1. Purga el caché de Cloudflare (si lo usas)")
        print("2. Abre https://inmovaapp.com en ventana INCÓGNITA")
        print("3. Login: superadmin@inmova.app / Admin123!")
        print("4. El tutorial NO debería aparecer")
        print("")
        print("⚠️  Si aún aparece, presiona Ctrl+Shift+R para forzar recarga")
        print("")
    else:
        print("\n❌ Error actualizando rol")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
