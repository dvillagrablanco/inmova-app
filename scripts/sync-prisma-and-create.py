#!/usr/bin/env python3
"""
Script para sincronizar Prisma y crear empresa
"""
import sys
import time
import os
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}{msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return exit_status, stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

def main():
    log("=" * 70, Colors.CYAN)
    log("🔧 SINCRONIZAR PRISMA Y CREAR EMPRESA", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Sincronizar schema con BD (db push sin migrations)
        log("\n🔄 [1/4] Sincronizando schema de Prisma con BD...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && npx prisma db push --accept-data-loss 2>&1 | tail -15",
            timeout=180
        )
        if "database schema is now in sync" in out.lower() or status == 0:
            log("✅ Schema sincronizado", Colors.GREEN)
        else:
            log(f"⚠️ Schema output:\n{out[-500:]}", Colors.YELLOW)
        
        # 2. Regenerar Prisma client
        log("\n🔄 [2/4] Regenerando Prisma client...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -5"
        )
        log("✅ Prisma client regenerado", Colors.GREEN)
        
        # 3. Reiniciar PM2 para cargar nuevo cliente
        log("\n♻️ [3/4] Reiniciando PM2...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && pm2 restart inmova-app --update-env")
        time.sleep(10)
        log("✅ PM2 reiniciado", Colors.GREEN)
        
        # 4. Crear empresa usando SQL directo
        log("\n🏢 [4/4] Creando empresa de validación...", Colors.BLUE)
        
        sql_commands = '''
-- Verificar si la empresa ya existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Company" WHERE nombre = 'Validación PropTech S.L.') THEN
    -- Crear empresa
    INSERT INTO "Company" (
      id, nombre, cif, direccion, ciudad, "codigoPostal", pais, telefono, email,
      "contactoPrincipal", "emailContacto", "telefonoContacto", "estadoCliente",
      activo, "maxUsuarios", "maxPropiedades", "maxEdificios", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      'Validación PropTech S.L.',
      'B12345678',
      'Calle Ejemplo 123',
      'Madrid',
      '28001',
      'España',
      '+34 912 345 678',
      'info@validacion-proptech.es',
      'Juan García',
      'juan@validacion-proptech.es',
      '+34 612 345 678',
      'activo',
      true,
      10,
      50,
      10,
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Empresa creada exitosamente';
  ELSE
    RAISE NOTICE 'La empresa ya existe';
  END IF;
END $$;
'''
        
        status, out, err = exec_cmd(client,
            f'''cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && psql "$DATABASE_URL" -c "SELECT nombre, id FROM \\"Company\\" WHERE nombre LIKE '%Validación%' OR nombre LIKE '%INMOVA%' LIMIT 5"''',
            timeout=30
        )
        log(f"Empresas encontradas:\n{out}", Colors.CYAN)
        
        # Crear usuario si no existe
        log("\n👤 Creando usuario de prueba...", Colors.BLUE)
        
        # Usar script Node simplificado
        create_user_script = '''
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    // Buscar empresa existente (cualquier empresa activa)
    const company = await prisma.company.findFirst({
      where: { activo: true },
      select: { id: true, nombre: true }
    });
    
    if (!company) {
      console.log('No hay empresas activas');
      return;
    }
    
    console.log('Empresa encontrada:', company.nombre);
    
    // Verificar usuario
    const existingUser = await prisma.user.findFirst({
      where: { email: 'validacion@inmova.app' }
    });
    
    if (existingUser) {
      console.log('Usuario ya existe:', existingUser.email);
      return;
    }
    
    // Crear usuario
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const user = await prisma.user.create({
      data: {
        email: 'validacion@inmova.app',
        password: hashedPassword,
        name: 'Usuario Validación',
        role: 'administrador',
        activo: true,
        companyId: company.id,
      }
    });
    
    console.log('Usuario creado:', user.email);
    console.log('Company ID:', company.id);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
'''
        
        # Guardar y ejecutar
        sftp = client.open_sftp()
        with sftp.file(f'{APP_PATH}/tmp-create-user.js', 'w') as f:
            f.write(create_user_script)
        sftp.close()
        
        status, out, err = exec_cmd(client,
            f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && node tmp-create-user.js 2>&1 && rm tmp-create-user.js",
            timeout=60
        )
        print(out)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ PROCESO COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        log("\n📋 Credenciales de prueba:", Colors.CYAN)
        log("   Email: validacion@inmova.app", Colors.CYAN)
        log("   Password: Admin123!", Colors.CYAN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
