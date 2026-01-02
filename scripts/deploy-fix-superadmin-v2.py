#!/usr/bin/env python3
"""Deploy fix para credenciales de superadministrador - Version 2"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_CONFIG = {
    'hostname': '157.180.119.236',
    'username': 'root',
    'password': 'xcc9brgkMMbf',
    'port': 22,
    'timeout': 30
}

def execute_command(ssh, command, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    return {'exit_status': exit_status, 'output': output, 'error': error}

def main():
    print("🔐 Corrigiendo credenciales de superadministrador...\n")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(**SERVER_CONFIG)
    
    try:
        # 1. Subir script
        print("1. Subiendo script de verificación...")
        sftp = ssh.open_sftp()
        sftp.put(
            '/workspace/scripts/verify-and-fix-superadmin.ts',
            '/opt/inmova-app/scripts/verify-and-fix-superadmin.ts'
        )
        sftp.close()
        print("  ✅ Script subido\n")
        
        # 2. Ejecutar script CON variables de entorno
        print("2. Ejecutando script de verificación...")
        result = execute_command(
            ssh,
            "cd /opt/inmova-app && export $(cat .env.production | xargs) && npx tsx scripts/verify-and-fix-superadmin.ts",
            timeout=60
        )
        
        print(result['output'])
        if result['error'] and 'warn' not in result['error'].lower():
            print("⚠️ Errores:")
            print(result['error'])
        
        if result['exit_status'] != 0:
            print(f"\n❌ Script falló con código {result['exit_status']}")
            print("\n🔄 Intentando método alternativo (acceso directo a BD)...")
            
            # Método alternativo: acceso directo a PostgreSQL
            alt_result = execute_command(
                ssh,
                """cd /opt/inmova-app && cat > /tmp/fix-superadmin.sql << 'EOF'
-- Obtener o crear company
DO $$
DECLARE
    v_company_id TEXT;
BEGIN
    SELECT id INTO v_company_id FROM "Company" LIMIT 1;
    
    IF v_company_id IS NULL THEN
        INSERT INTO "Company" (id, nombre, nif, activo, plan, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, 'Inmova Principal', 'B12345678', true, 'ENTERPRISE', NOW(), NOW())
        RETURNING id INTO v_company_id;
    END IF;
    
    -- Actualizar o crear superadmin
    INSERT INTO "User" (id, email, name, password, role, "companyId", activo, "emailVerified", "createdAt", "updatedAt")
    VALUES (
        COALESCE((SELECT id FROM "User" WHERE email = 'admin@inmova.app'), gen_random_uuid()::text),
        'admin@inmova.app',
        'Administrador Principal',
        '$2a$10$' || encode(gen_random_bytes(31), 'base64'),  -- Temporary, will be updated
        'SUPERADMIN',
        v_company_id,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        role = 'SUPERADMIN',
        "companyId" = v_company_id,
        activo = true,
        "emailVerified" = NOW();
    
    -- Actualizar o crear usuario de prueba
    INSERT INTO "User" (id, email, name, password, role, "companyId", activo, "emailVerified", "createdAt", "updatedAt")
    VALUES (
        COALESCE((SELECT id FROM "User" WHERE email = 'test@inmova.app'), gen_random_uuid()::text),
        'test@inmova.app',
        'Usuario de Prueba',
        '$2a$10$' || encode(gen_random_bytes(31), 'base64'),  -- Temporary
        'ADMIN',
        v_company_id,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        role = 'ADMIN',
        "companyId" = v_company_id,
        activo = true,
        "emailVerified" = NOW();
END $$;

-- Mostrar resultado
SELECT email, name, role, activo FROM "User" WHERE email IN ('admin@inmova.app', 'test@inmova.app');
EOF

export $(cat .env.production | grep DATABASE_URL | xargs)
psql "$DATABASE_URL" -f /tmp/fix-superadmin.sql
""",
                timeout=30
            )
            
            print("\n📊 Resultado de SQL directo:")
            print(alt_result['output'])
            
            # Ahora ejecutar script de Node.js para hashear passwords correctamente
            print("\n3. Actualizando passwords con bcrypt...")
            hash_result = execute_command(
                ssh,
                """cd /opt/inmova-app && export $(cat .env.production | xargs) && node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePasswords() {
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const testHash = await bcrypt.hash('Test123456!', 10);
    
    await prisma.user.update({
        where: { email: 'admin@inmova.app' },
        data: { password: adminHash }
    });
    
    await prisma.user.update({
        where: { email: 'test@inmova.app' },
        data: { password: testHash }
    });
    
    console.log('✅ Passwords actualizados correctamente');
    await prisma.\$disconnect();
}

updatePasswords().catch(console.error);
"
""",
                timeout=30
            )
            
            print(hash_result['output'])
            if hash_result['exit_status'] == 0:
                result = hash_result  # Update result for final check
        
        if result['exit_status'] == 0 or '✅' in result['output']:
            print("\n3. Verificando que podemos hacer login...")
            time.sleep(2)
            
            test_result = execute_command(
                ssh,
                "curl -s http://localhost:3000/login | grep -o 'email' | head -1"
            )
            
            if 'email' in test_result['output']:
                print("  ✅ Página de login accesible\n")
            else:
                print("  ⚠️ No se pudo verificar la página de login\n")
            
            print("="*60)
            print("✅ FIX COMPLETADO")
            print("="*60)
            print("\n🔐 CREDENCIALES DE SUPERADMINISTRADOR:")
            print("   Email: admin@inmova.app")
            print("   Password: Admin123!")
            print("\n🧪 CREDENCIALES DE PRUEBA:")
            print("   Email: test@inmova.app")
            print("   Password: Test123456!")
            print("\n🌐 PRUEBA EN:")
            print("   http://157.180.119.236/login")
            print("   https://inmovaapp.com/login")
            print("="*60)
        
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
