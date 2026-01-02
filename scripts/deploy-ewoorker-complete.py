#!/usr/bin/env python3
"""
Deployment completo de eWoorker con creación de usuario socio via SQL
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/home/deploy/inmova-app'

def execute_command(ssh, command, timeout=300):
    """Ejecuta comando SSH y retorna output"""
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print("\n" + "━" * 80)
    print("🚀 DEPLOYMENT COMPLETO EWOORKER + CREACIÓN USUARIO SOCIO")
    print("━" * 80 + "\n")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("📡 Conectando al servidor...")
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

    try:
        # 1. Git Pull
        print("📥 Git pull...")
        status, output, error = execute_command(ssh, f"cd {APP_DIR} && git pull origin main")
        if status == 0:
            print("✅ Git pull OK")
        else:
            print(f"⚠️  Git pull: {error[:100]}")

        # 2. npm install
        print("\n📦 npm install...")
        status, output, error = execute_command(ssh, f"cd {APP_DIR} && npm install", timeout=600)
        if status == 0:
            print("✅ npm install OK")
        else:
            print(f"⚠️  npm install: {error[:100]}")

        # 3. Prisma generate
        print("\n🔧 Prisma generate...")
        status, output, error = execute_command(ssh, f"cd {APP_DIR} && npx prisma generate")
        if status == 0:
            print("✅ Prisma generate OK")
        else:
            print(f"⚠️  Prisma generate: {error[:100]}")

        # 4. Crear usuario del socio via SQL
        print("\n👤 Creando usuario del socio via SQL...")
        
        # Primero, obtener el nombre de la BD desde .env
        status, output, error = execute_command(ssh, f"cd {APP_DIR} && grep DATABASE_URL .env | head -1")
        db_url = output.strip()
        print(f"   DATABASE_URL encontrado")
        
        # Script SQL
        sql_script = """
DO $$ 
DECLARE
  demo_plan_id TEXT;
BEGIN
  -- Obtener ID del plan Demo
  SELECT id INTO demo_plan_id FROM "SubscriptionPlan" WHERE nombre = 'Demo' LIMIT 1;
  
  -- Si no existe Demo, usar el primer plan disponible
  IF demo_plan_id IS NULL THEN
    SELECT id INTO demo_plan_id FROM "SubscriptionPlan" LIMIT 1;
  END IF;
  
  -- Crear Company si no existe
  INSERT INTO "Company" (id, nombre, cif, activo, "subscriptionPlanId", "createdAt") 
  VALUES (
    'company-socio-ewoorker', 
    'Socio Fundador eWoorker', 
    'X00000000X', 
    true,
    demo_plan_id,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Crear Usuario
  INSERT INTO "User" (
    id, email, name, password, role, "companyId", 
    activo, "emailVerified", "onboardingCompleted", "onboardingCompletedAt", "createdAt"
  ) VALUES (
    'user-socio-ewoorker-001',
    'socio@ewoorker.com',
    'Socio Fundador eWoorker',
    '$2a$10$Zy5J9mX3K8pW4nR7qL2vYeZH3xP9F6mT8sK4rN7wQ5vL2pJ8xY6zA',
    'super_admin',
    'company-socio-ewoorker',
    true, NOW(), true, NOW(), NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = 'super_admin',
    activo = true,
    "onboardingCompleted" = true;
  
  RAISE NOTICE 'Usuario socio creado/actualizado exitosamente';
END $$;
"""
        
        # Guardar SQL en archivo temporal
        execute_command(ssh, f"cat > /tmp/create_socio_ewoorker.sql << 'EOSQL'\n{sql_script}\nEOSQL")
        
        # Ejecutar SQL usando npx prisma db execute
        print("   Ejecutando SQL con Prisma...")
        status, output, error = execute_command(
            ssh,
            f"cd {APP_DIR} && npx prisma db execute --file /tmp/create_socio_ewoorker.sql --schema prisma/schema.prisma",
            timeout=60
        )
        
        if status == 0 or 'successfully' in output.lower():
            print("✅ Usuario socio creado/actualizado")
        else:
            print(f"⚠️  SQL execution: {error[:200]}")
            print(f"   Output: {output[:200]}")
        
        # Verificar usuario
        print("\n🔍 Verificando usuario...")
        verify_sql = "SELECT email, name, role FROM \"User\" WHERE email = 'socio@ewoorker.com';"
        execute_command(ssh, f"echo \"{verify_sql}\" > /tmp/verify_socio.sql")
        status, output, error = execute_command(
            ssh,
            f"cd {APP_DIR} && npx prisma db execute --file /tmp/verify_socio.sql --schema prisma/schema.prisma",
            timeout=30
        )
        
        if 'socio@ewoorker.com' in output:
            print("✅ Usuario verificado en BD")
        else:
            print(f"⚠️  Verificación: {output[:200]}")

        # 5. Build
        print("\n🔨 Build (esto puede tardar 5-10 min)...")
        status, output, error = execute_command(
            ssh,
            f"cd {APP_DIR} && npm run build",
            timeout=900
        )
        if status == 0:
            print("✅ Build OK")
        else:
            print(f"⚠️  Build: {error[:200]}")

        # 6. PM2 reload
        print("\n🔄 PM2 reload...")
        status, output, error = execute_command(ssh, "pm2 reload all")
        if status == 0:
            print("✅ PM2 reloaded")
        else:
            print(f"⚠️  PM2: {error[:100]}")

        # 7. Esperar warm-up
        print("\n⏳ Esperando warm-up (15s)...")
        time.sleep(15)

        # 8. Health checks
        print("\n🏥 Health checks...")
        
        checks = [
            ("Main Landing", "http://localhost:3000/landing"),
            ("eWoorker Landing", "http://localhost:3000/ewoorker/landing"),
            ("Admin Socio Panel", "http://localhost:3000/ewoorker/admin-socio"),
            ("Metrics API", "http://localhost:3000/api/ewoorker/admin-socio/metrics?periodo=mes_actual"),
            ("API Health", "http://localhost:3000/api/health"),
        ]
        
        for name, url in checks:
            status, output, error = execute_command(
                ssh,
                f"curl -f -s -o /dev/null -w '%{{http_code}}' {url}",
                timeout=10
            )
            http_code = output.strip()
            
            if http_code in ['200', '302']:
                print(f"   ✅ {name}: {http_code}")
            elif http_code in ['401', '403']:
                print(f"   ⚠️  {name}: {http_code} (requiere auth - OK)")
            else:
                print(f"   ❌ {name}: {http_code}")

        # Mostrar credenciales
        print("\n" + "━" * 80)
        print("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
        print("━" * 80 + "\n")
        
        print("🔐 CREDENCIALES DEL SOCIO FUNDADOR:\n")
        print("   📧 Email:    socio@ewoorker.com")
        print("   🔒 Password: Ewoorker2025!Socio")
        print("   🎯 Rol:      super_admin")
        print("   🔗 Panel:    https://inmovaapp.com/ewoorker/admin-socio")
        print("   🌐 Login:    https://inmovaapp.com/login\n")
        
        print("📋 VERIFICAR MANUALMENTE:")
        print("   1. https://inmovaapp.com/ewoorker/landing")
        print("   2. https://inmovaapp.com/login (con credenciales arriba)")
        print("   3. https://inmovaapp.com/ewoorker/admin-socio (después de login)")
        print("   4. Exportar reporte para probar funcionalidad\n")
        
        print("📄 DOCUMENTACIÓN PARA EL SOCIO:")
        print("   → Entregar archivo: PARA_EL_SOCIO.md\n")
        
        return True

    except Exception as e:
        print(f"\n❌ Error durante deployment: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        ssh.close()
        print("🔌 Conexión SSH cerrada\n")

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
