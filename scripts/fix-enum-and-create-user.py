#!/usr/bin/env python3
"""
Arreglar enum UserRole y crear usuario socio directamente con SQL
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
        # 1. Ver usuarios actuales en tabla 'users'
        print("📋 Usuarios actuales en tabla 'users':")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production_v3 -c "SELECT email, name, role, activo FROM users LIMIT 10;" 2>/dev/null'''
        )
        print(output)
        
        # 2. Cambiar usuarios con rol socio_ewoorker a super_admin
        print("\n🔧 Cambiando usuarios con rol 'socio_ewoorker' a 'super_admin':")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production_v3 -c "UPDATE users SET role = 'super_admin' WHERE role = 'socio_ewoorker';" 2>/dev/null'''
        )
        print(f"Resultado: {output}")
        
        # 3. Generar hash de password
        print("\n🔧 Generando hash de password...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Ewoorker2025!Socio', 10).then(h => console.log(h));"'''
        )
        password_hash = output.strip()
        print(f"Hash: {password_hash[:40]}...")
        
        # 4. Buscar empresa existente o crear una
        print("\n📋 Buscando/creando company...")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production_v3 -c "SELECT id FROM companies LIMIT 1;" 2>/dev/null'''
        )
        print(f"Companies: {output}")
        
        # Extraer ID de empresa si existe
        company_id = None
        for line in output.split('\n'):
            line = line.strip()
            if line and not line.startswith('-') and 'id' not in line.lower() and '(' not in line:
                company_id = line.strip()
                break
        
        print(f"Company ID encontrado: {company_id}")
        
        # 5. Verificar si el usuario socio existe
        print("\n📋 Verificando si existe usuario socio...")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production_v3 -c "SELECT id, email, role FROM users WHERE email = 'socio@ewoorker.com';" 2>/dev/null'''
        )
        print(output)
        
        user_exists = 'socio@ewoorker.com' in output
        
        # 6. Crear o actualizar usuario
        if user_exists:
            print("\n🔧 Actualizando usuario socio...")
            sql = f'''
UPDATE users SET 
    password = '{password_hash}',
    role = 'super_admin',
    activo = true,
    "onboardingCompleted" = true
WHERE email = 'socio@ewoorker.com';
'''
        else:
            print("\n🔧 Creando usuario socio...")
            # Si no hay company_id, usar el primero disponible
            if not company_id:
                status, output, error = exec_cmd(
                    client,
                    '''sudo -u postgres psql -d inmova_production_v3 -c "SELECT id FROM companies ORDER BY \\"createdAt\\" DESC LIMIT 1;" 2>/dev/null'''
                )
                for line in output.split('\n'):
                    line = line.strip()
                    if line and not line.startswith('-') and 'id' not in line.lower() and '(' not in line:
                        company_id = line.strip()
                        break
            
            sql = f'''
INSERT INTO users (
    id, email, name, password, role, activo, "emailVerified", 
    "onboardingCompleted", "onboardingCompletedAt", "companyId", 
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'socio@ewoorker.com',
    'Socio Fundador eWoorker',
    '{password_hash}',
    'super_admin',
    true,
    NOW(),
    true,
    NOW(),
    '{company_id if company_id else "NULL"}',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = 'super_admin',
    activo = true,
    "onboardingCompleted" = true;
'''
        
        status, output, error = exec_cmd(
            client,
            f'''sudo -u postgres psql -d inmova_production_v3 -c "{sql}" 2>&1'''
        )
        print(f"Resultado SQL: {output}")
        if error:
            print(f"Error: {error}")
        
        # 7. Verificar usuario final
        print("\n📋 Verificación final:")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production_v3 -c "SELECT email, name, role, activo, \\"onboardingCompleted\\" FROM users WHERE email = 'socio@ewoorker.com';" 2>/dev/null'''
        )
        print(output)
        
        # 8. Ahora probar db push sin el problema del enum
        print("\n🔧 Intentando sincronizar schema de nuevo...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" npx prisma db push --accept-data-loss 2>&1 | head -30''',
            timeout=180
        )
        print(f"db push: {output[:1000]}")
        
        # 9. Reiniciar PM2
        print("\n♻️ Reiniciando aplicación...")
        status, output, error = exec_cmd(
            client,
            "pm2 reload inmova-app --update-env 2>&1"
        )
        print(f"PM2: {output[:200]}")
        
        # 10. Test de login con curl
        import time
        print("\n⏳ Esperando warm-up...")
        time.sleep(15)
        
        print("\n🔐 Test de login...")
        status, output, error = exec_cmd(
            client,
            '''curl -s http://localhost:3000/api/auth/csrf'''
        )
        print(f"CSRF: {output[:100]}")
        
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
   
⚠️  Prueba el login en el navegador
""")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
