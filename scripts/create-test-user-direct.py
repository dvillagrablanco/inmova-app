#!/usr/bin/env python3
"""
Crear usuario de prueba directamente en base de datos
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

print("=" * 60)
print("👤 CREANDO USUARIO DE PRUEBA")
print("=" * 60)

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("\n📡 Conectando...")
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
    print("✅ Conectado")
    
    # Ejecutar script que genera hash y crea usuario
    print("\n🔐 Generando hash bcrypt...")
    
    script = f"""cd {APP_DIR} && node -e "
const bcrypt = require('bcryptjs');
const {{ PrismaClient }} = require('@prisma/client');

async function createTestUser() {{
  const prisma = new PrismaClient();
  
  try {{
    // Generar hash
    const password = 'Test123456!';
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash generado:', hash.substring(0, 20) + '...');
    
    // Buscar o crear company
    let company = await prisma.company.findFirst();
    
    if (!company) {{
      console.log('No hay companies, creando una...');
      company = await prisma.company.create({{
        data: {{
          name: 'Empresa de Prueba',
          email: 'empresa@prueba.com',
          businessVertical: 'alquiler_tradicional'
        }}
      }});
      console.log('Company creada:', company.id);
    }} else {{
      console.log('Company encontrada:', company.id);
    }}
    
    // Verificar si usuario existe
    const existingUser = await prisma.users.findUnique({{
      where: {{ email: 'principiante@gestor.es' }}
    }});
    
    if (existingUser) {{
      console.log('Usuario ya existe, actualizando...');
      const updated = await prisma.users.update({{
        where: {{ email: 'principiante@gestor.es' }},
        data: {{
          password: hash,
          activo: true,
          role: 'gestor',
          name: 'Usuario Principiante',
          companyId: company.id
        }}
      }});
      console.log('✅ Usuario actualizado:', updated.email);
    }} else {{
      console.log('Usuario no existe, creando...');
      const user = await prisma.users.create({{
        data: {{
          email: 'principiante@gestor.es',
          password: hash,
          name: 'Usuario Principiante',
          role: 'gestor',
          activo: true,
          companyId: company.id,
          preferences: {{}}
        }}
      }});
      console.log('✅ Usuario creado:', user.email);
    }}
    
    // Verificar
    const user = await prisma.users.findUnique({{
      where: {{ email: 'principiante@gestor.es' }},
      select: {{
        email: true,
        name: true,
        role: true,
        activo: true,
        companyId: true
      }}
    }});
    
    console.log('\\n✅ Usuario verificado:');
    console.log(JSON.stringify(user, null, 2));
    
  }} catch (error) {{
    console.error('❌ Error:', error.message);
    process.exit(1);
  }} finally {{
    await prisma.$disconnect();
  }}
}}

createTestUser();
"
"""
    
    stdin, stdout, stderr = client.exec_command(script, timeout=60)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    print(output)
    
    if exit_status != 0:
        print(f"\n❌ Error:\n{error}")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ USUARIO DE PRUEBA LISTO")
    print("=" * 60)
    print("\n📋 CREDENCIALES:")
    print("   Email: principiante@gestor.es")
    print("   Password: Test123456!")
    print("\n🌐 PROBAR EN:")
    print("   https://inmovaapp.com/login")
    print("=" * 60)
    
    client.close()
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
