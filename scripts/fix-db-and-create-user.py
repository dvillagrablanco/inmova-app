#!/usr/bin/env python3
"""
Aplicar migraciones y crear usuario socio
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

def exec_cmd(client, command, timeout=300):
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
        # 1. Ver TODAS las tablas en inmova_production_v3
        print("📋 Todas las tablas en inmova_production_v3:")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production_v3 -c "\\dt" 2>/dev/null | head -50'''
        )
        print(output)
        
        # 2. Buscar tabla User con diferentes cases
        print("\n📋 Buscando tabla User/users:")
        for table in ['User', 'users', 'user']:
            status, output, error = exec_cmd(
                client,
                f'''sudo -u postgres psql -d inmova_production_v3 -c "SELECT COUNT(*) FROM \\"{table}\\";" 2>/dev/null'''
            )
            if 'does not exist' not in str(error) and 'count' in output.lower():
                print(f"  Tabla '{table}' existe: {output.strip()}")
            else:
                print(f"  Tabla '{table}' NO existe")
        
        # 3. Ver el .env.local que puede tener la BD correcta
        print("\n📋 Contenido de .env.local:")
        status, output, error = exec_cmd(
            client,
            "cat /opt/inmova-app/.env.local 2>/dev/null | grep -v '^#' | head -20"
        )
        print(output)
        
        # 4. Aplicar migraciones pendientes
        print("\n🔧 Aplicando migraciones...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" npx prisma migrate deploy 2>&1''',
            timeout=300
        )
        print(f"Output: {output[:2000]}")
        if error:
            print(f"Error: {error[:500]}")
        
        # 5. Si falla, usar db push
        if 'error' in output.lower() or status != 0:
            print("\n🔧 Intentando db push...")
            status, output, error = exec_cmd(
                client,
                '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" npx prisma db push --accept-data-loss 2>&1''',
                timeout=300
            )
            print(f"Output: {output[:2000]}")
        
        # 6. Regenerar Prisma client
        print("\n🔧 Regenerando Prisma client...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" npx prisma generate 2>&1'''
        )
        print(f"Output: {output[:500]}")
        
        # 7. Verificar tabla User ahora
        print("\n📋 Verificando tabla User después de migración:")
        status, output, error = exec_cmd(
            client,
            '''sudo -u postgres psql -d inmova_production_v3 -c "SELECT COUNT(*) as total FROM \\"User\\";" 2>/dev/null'''
        )
        print(output)
        
        # 8. Ahora crear el usuario socio
        print("\n🔧 Creando usuario socio...")
        status, output, error = exec_cmd(
            client,
            '''cd /opt/inmova-app && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v3" node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Conectando...');
  await prisma.\\$queryRaw\\`SELECT 1\\`;
  console.log('✓ Conexión OK');
  
  const hash = await bcrypt.hash('Ewoorker2025!Socio', 10);
  console.log('✓ Hash generado');
  
  const plan = await prisma.subscriptionPlan.findFirst();
  if (!plan) {
    console.log('Creando plan básico...');
    await prisma.subscriptionPlan.create({
      data: { nombre: 'Demo', precio: 0, descripcion: 'Plan demo', activo: true }
    });
  }
  const planFinal = await prisma.subscriptionPlan.findFirst();
  console.log('✓ Plan:', planFinal?.nombre);
  
  let company = await prisma.company.findFirst({ where: { nombre: 'Socio Fundador eWoorker' } });
  if (!company) {
    company = await prisma.company.create({
      data: { nombre: 'Socio Fundador eWoorker', cif: 'X00000000X', activo: true, subscriptionPlanId: planFinal.id }
    });
    console.log('✓ Company creada');
  }
  
  const exists = await prisma.user.findUnique({ where: { email: 'socio@ewoorker.com' } });
  if (exists) {
    await prisma.user.update({
      where: { email: 'socio@ewoorker.com' },
      data: { password: hash, role: 'super_admin', activo: true, onboardingCompleted: true }
    });
    console.log('✓ Usuario actualizado');
  } else {
    await prisma.user.create({
      data: {
        email: 'socio@ewoorker.com',
        name: 'Socio Fundador eWoorker',
        password: hash,
        role: 'super_admin',
        activo: true,
        emailVerified: new Date(),
        onboardingCompleted: true,
        companyId: company.id
      }
    });
    console.log('✓ Usuario creado');
  }
  
  const user = await prisma.user.findUnique({ where: { email: 'socio@ewoorker.com' }, select: { email: true, role: true, activo: true } });
  console.log('✅ Usuario:', JSON.stringify(user));
}

main().catch(e => console.log('ERROR:', e.message)).finally(() => prisma.\\$disconnect());
" 2>&1''',
            timeout=60
        )
        print(f"Output: {output}")
        
        # 9. Restart PM2
        print("\n♻️ Reiniciando PM2...")
        status, output, error = exec_cmd(
            client,
            "pm2 restart inmova-app --update-env 2>&1"
        )
        print(f"PM2: {output[:200]}")
        
        print("\n" + "=" * 60)
        print("✅ PROCESO COMPLETADO")
        print("=" * 60)
        print("""
🔐 CREDENCIALES:
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
