#!/usr/bin/env python3
"""
Encontrar el DATABASE_URL real y crear usuario socio
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
        # 1. Ver variables de PM2
        print("📋 Variables de entorno en PM2...")
        status, output, error = exec_cmd(client, "pm2 env 0 2>/dev/null | grep -i database")
        print(f"PM2 env: {output}")
        
        # 2. Ver ecosystem.config.js
        print("\n📋 Ecosystem config...")
        status, output, error = exec_cmd(client, "cat /opt/inmova-app/ecosystem.config.js 2>/dev/null | head -50")
        print(f"{output[:1000]}")
        
        # 3. Ver si hay .env o .env.local
        print("\n📋 Archivos .env...")
        status, output, error = exec_cmd(client, "ls -la /opt/inmova-app/.env* 2>/dev/null")
        print(f"{output}")
        
        # 4. Ver contenido de .env (no .env.production)
        print("\n📋 Contenido de .env (si existe)...")
        status, output, error = exec_cmd(client, "cat /opt/inmova-app/.env 2>/dev/null | grep -i database")
        print(f"{output}")
        
        # 5. Ver PostgreSQL local
        print("\n📋 PostgreSQL local...")
        status, output, error = exec_cmd(client, "systemctl status postgresql 2>/dev/null | head -10")
        print(f"{output}")
        
        # 6. Listar bases de datos
        print("\n📋 Bases de datos PostgreSQL...")
        status, output, error = exec_cmd(client, "sudo -u postgres psql -l 2>/dev/null | head -15")
        print(f"{output}")
        
        # 7. Ver usuarios PostgreSQL
        print("\n📋 Usuarios PostgreSQL...")
        status, output, error = exec_cmd(client, "sudo -u postgres psql -c '\\du' 2>/dev/null | head -15")
        print(f"{output}")
        
        # 8. Intentar conectar con postgres user directamente
        print("\n📋 Verificando usuarios en BD inmova_production...")
        status, output, error = exec_cmd(
            client, 
            '''sudo -u postgres psql -d inmova_production -c "SELECT email, role, activo FROM \\"User\\" WHERE email LIKE '%socio%' OR email LIKE '%ewoorker%';" 2>/dev/null'''
        )
        print(f"{output}")
        if error:
            print(f"Error: {error[:200]}")
            
        # 9. Crear el usuario socio directamente con SQL
        print("\n🔧 Creando usuario socio con SQL directo...")
        
        # Primero hashear el password
        hash_cmd = '''
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('Ewoorker2025!Socio', 10).then(h => console.log(h));
"
'''
        status, output, error = exec_cmd(client, f"cd /opt/inmova-app && {hash_cmd}")
        password_hash = output.strip()
        print(f"Hash generado: {password_hash[:40]}...")
        
        # Crear usuario con SQL
        create_sql = f'''
-- Buscar un plan de suscripción
DO $$
DECLARE
    plan_id TEXT;
    company_id TEXT;
    user_exists BOOLEAN;
BEGIN
    -- Obtener un plan existente
    SELECT id INTO plan_id FROM "SubscriptionPlan" LIMIT 1;
    
    IF plan_id IS NULL THEN
        RAISE NOTICE 'No hay planes de suscripción';
        RETURN;
    END IF;
    
    -- Verificar si company existe
    SELECT id INTO company_id FROM "Company" WHERE nombre = 'Socio Fundador eWoorker';
    
    IF company_id IS NULL THEN
        -- Crear company
        INSERT INTO "Company" (id, nombre, cif, activo, "subscriptionPlanId", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid()::text,
            'Socio Fundador eWoorker',
            'X00000000X',
            true,
            plan_id,
            NOW(),
            NOW()
        )
        RETURNING id INTO company_id;
        RAISE NOTICE 'Company creada: %', company_id;
    ELSE
        RAISE NOTICE 'Company existe: %', company_id;
    END IF;
    
    -- Verificar si usuario existe
    SELECT EXISTS(SELECT 1 FROM "User" WHERE email = 'socio@ewoorker.com') INTO user_exists;
    
    IF user_exists THEN
        -- Actualizar usuario
        UPDATE "User" SET
            password = '{password_hash}',
            role = 'super_admin',
            activo = true,
            "onboardingCompleted" = true,
            "companyId" = company_id
        WHERE email = 'socio@ewoorker.com';
        RAISE NOTICE 'Usuario actualizado';
    ELSE
        -- Crear usuario
        INSERT INTO "User" (id, email, name, password, role, activo, "emailVerified", "onboardingCompleted", "onboardingCompletedAt", "companyId", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid()::text,
            'socio@ewoorker.com',
            'Socio Fundador eWoorker',
            '{password_hash}',
            'super_admin',
            true,
            NOW(),
            true,
            NOW(),
            company_id,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Usuario creado';
    END IF;
END $$;

-- Verificar resultado
SELECT id, email, name, role, activo, "onboardingCompleted" 
FROM "User" 
WHERE email = 'socio@ewoorker.com';
'''
        
        status, output, error = exec_cmd(
            client,
            f'''sudo -u postgres psql -d inmova_production -c "{create_sql}" 2>&1'''
        )
        print(f"Resultado SQL:\n{output}")
        if error:
            print(f"Error: {error[:500]}")
        
        # 10. Verificar creación final
        print("\n📋 Verificación final del usuario...")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production -c "SELECT email, name, role, activo FROM \\"User\\" WHERE email = 'socio@ewoorker.com';" 2>/dev/null'''
        )
        print(f"{output}")
        
        print("\n" + "=" * 60)
        print("✅ PROCESO COMPLETADO")
        print("=" * 60)
        print("""
🔐 CREDENCIALES DEL SOCIO:
   Email:    socio@ewoorker.com
   Password: Ewoorker2025!Socio
   
🌐 URLs:
   Login:    https://inmovaapp.com/login
   Panel:    https://inmovaapp.com/ewoorker/admin-socio
""")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
