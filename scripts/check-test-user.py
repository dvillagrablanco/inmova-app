#!/usr/bin/env python3
"""
Verificar usuario de prueba en base de datos
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def execute_command(client, command):
    """Ejecuta comando y retorna output"""
    stdin, stdout, stderr = client.exec_command(command, timeout=30)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status == 0, output

print("=" * 60)
print("🔍 VERIFICANDO USUARIO DE PRUEBA")
print("=" * 60)

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("\n📡 Conectando al servidor...")
    client.connect(
        SERVER_IP,
        username=USERNAME,
        password=PASSWORD,
        timeout=30,
        look_for_keys=False,
        allow_agent=False
    )
    print("✅ Conectado")
    
    # Verificar usuario principiante@gestor.es
    print("\n🔍 Buscando usuario: principiante@gestor.es")
    
    success, output = execute_command(
        client,
        f"""cd {APP_DIR} && node -e "
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {{
  const user = await prisma.user.findUnique({{
    where: {{ email: 'principiante@gestor.es' }},
    select: {{
      id: true,
      email: true,
      name: true,
      role: true,
      activo: true,
      companyId: true,
      createdAt: true,
      password: true
    }}
  }});
  
  if (!user) {{
    console.log('❌ Usuario NO encontrado en base de datos');
    return;
  }}
  
  console.log('✅ Usuario encontrado:');
  console.log(JSON.stringify({{
    email: user.email,
    name: user.name,
    role: user.role,
    activo: user.activo,
    companyId: user.companyId,
    hasPassword: !!user.password,
    passwordLength: user.password ? user.password.length : 0,
    passwordStart: user.password ? user.password.substring(0, 7) : 'N/A',
    createdAt: user.createdAt
  }}, null, 2));
  
  await prisma.\\$disconnect();
}}

checkUser();
"
"""
    )
    
    print(output)
    
    # Listar todos los usuarios disponibles
    print("\n📋 Listando todos los usuarios activos:")
    
    success, output = execute_command(
        client,
        f"""cd {APP_DIR} && node -e "
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {{
  const users = await prisma.user.findMany({{
    where: {{ activo: true }},
    select: {{
      email: true,
      name: true,
      role: true,
      activo: true
    }},
    take: 20
  }});
  
  console.log('Total usuarios activos:', users.length);
  console.log('\\nUsuarios:');
  users.forEach(u => {{
    console.log(\`- \${{u.email}} | \${{u.name}} | \${{u.role}}\`);
  }});
  
  await prisma.\\$disconnect();
}}

listUsers();
"
"""
    )
    
    print(output)
    
    client.close()
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
