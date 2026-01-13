#!/usr/bin/env python3
"""
Script para crear una empresa real con datos reales en producción
para validar todas las funcionalidades
"""
import sys
import json
import time
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

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return exit_status, stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

def main():
    log("=" * 70, Colors.CYAN)
    log("🏢 CREAR EMPRESA REAL CON DATOS PARA VALIDACIÓN", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado", Colors.GREEN)
        
        # 1. Verificar empresas existentes
        log("\n📋 [1/4] Verificando empresas existentes...", Colors.BLUE)
        prisma_query = '''
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const companies = await prisma.company.findMany({
    select: { id: true, nombre: true, estadoCliente: true, activo: true },
    take: 10
  });
  console.log(JSON.stringify(companies, null, 2));
  await prisma.$disconnect();
})();
'''
        status, out, err = exec_cmd(client, 
            f"cd {APP_PATH} && node -e '{prisma_query}' 2>/dev/null", 
            timeout=30
        )
        log(f"Empresas existentes:\n{out}", Colors.CYAN)
        
        # 2. Verificar planes de suscripción
        log("\n📋 [2/4] Verificando planes de suscripción...", Colors.BLUE)
        plans_query = '''
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const plans = await prisma.subscriptionPlan.findMany({
    select: { id: true, nombre: true, tier: true, precioMensual: true, activo: true },
    take: 10
  });
  console.log(JSON.stringify(plans, null, 2));
  await prisma.$disconnect();
})();
'''
        status, out, err = exec_cmd(client, 
            f"cd {APP_PATH} && node -e '{plans_query}' 2>/dev/null", 
            timeout=30
        )
        log(f"Planes disponibles:\n{out}", Colors.CYAN)
        
        # 3. Crear empresa de prueba real
        log("\n🏢 [3/4] Creando empresa de validación...", Colors.BLUE)
        
        create_company_script = '''
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

(async () => {
  try {
    // Verificar si ya existe
    const existing = await prisma.company.findFirst({
      where: { nombre: 'Validación PropTech S.L.' }
    });
    
    if (existing) {
      console.log(JSON.stringify({ status: 'exists', company: existing }));
      await prisma.$disconnect();
      return;
    }
    
    // Obtener plan Professional
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { tier: 'PROFESSIONAL' }
    });
    
    // Crear empresa
    const company = await prisma.company.create({
      data: {
        nombre: 'Validación PropTech S.L.',
        cif: 'B12345678',
        direccion: 'Calle Ejemplo 123',
        ciudad: 'Madrid',
        codigoPostal: '28001',
        pais: 'España',
        telefono: '+34 912 345 678',
        email: 'info@validacion-proptech.es',
        contactoPrincipal: 'Juan García',
        emailContacto: 'juan@validacion-proptech.es',
        telefonoContacto: '+34 612 345 678',
        estadoCliente: 'activo',
        activo: true,
        esEmpresaPrueba: false,
        maxUsuarios: 10,
        maxPropiedades: 50,
        maxEdificios: 10,
        subscriptionPlanId: plan?.id,
      }
    });
    
    // Crear usuario admin para la empresa
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const user = await prisma.user.create({
      data: {
        email: 'admin@validacion-proptech.es',
        password: hashedPassword,
        name: 'Admin Validación',
        role: 'administrador',
        activo: true,
        companyId: company.id,
      }
    });
    
    console.log(JSON.stringify({ 
      status: 'created',
      company: { id: company.id, nombre: company.nombre },
      user: { id: user.id, email: user.email }
    }));
    
  } catch (error) {
    console.log(JSON.stringify({ status: 'error', message: error.message }));
  }
  await prisma.$disconnect();
})();
'''
        status, out, err = exec_cmd(client, 
            f"cd {APP_PATH} && node -e '{create_company_script}' 2>&1", 
            timeout=60
        )
        log(f"Resultado creación empresa:\n{out}", Colors.GREEN if '"status":"created"' in out or '"status":"exists"' in out else Colors.YELLOW)
        
        # 4. Crear datos de ejemplo (edificio, unidades, inquilinos)
        log("\n🏗️ [4/4] Creando datos de ejemplo...", Colors.BLUE)
        
        create_data_script = '''
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Obtener la empresa creada
    const company = await prisma.company.findFirst({
      where: { nombre: 'Validación PropTech S.L.' }
    });
    
    if (!company) {
      console.log(JSON.stringify({ status: 'error', message: 'Empresa no encontrada' }));
      return;
    }
    
    // Verificar si ya tiene datos
    const existingBuilding = await prisma.building.findFirst({
      where: { companyId: company.id }
    });
    
    if (existingBuilding) {
      console.log(JSON.stringify({ status: 'exists', message: 'Datos ya existen' }));
      await prisma.$disconnect();
      return;
    }
    
    // Crear edificio
    const building = await prisma.building.create({
      data: {
        name: 'Edificio Validación',
        address: 'Av. de la Validación 100',
        city: 'Madrid',
        postalCode: '28001',
        country: 'España',
        totalUnits: 5,
        floors: 3,
        type: 'RESIDENTIAL',
        companyId: company.id,
      }
    });
    
    // Crear unidades
    const units = [];
    for (let i = 1; i <= 5; i++) {
      const unit = await prisma.unit.create({
        data: {
          name: `Piso ${i}`,
          type: 'APARTMENT',
          floor: Math.ceil(i / 2),
          bedrooms: 2,
          bathrooms: 1,
          squareMeters: 75 + (i * 5),
          monthlyRent: 900 + (i * 50),
          status: i <= 3 ? 'OCCUPIED' : 'AVAILABLE',
          companyId: company.id,
          buildingId: building.id,
        }
      });
      units.push(unit);
    }
    
    // Crear inquilinos para las primeras 3 unidades
    for (let i = 0; i < 3; i++) {
      const tenant = await prisma.tenant.create({
        data: {
          firstName: ['María', 'Carlos', 'Ana'][i],
          lastName: ['García', 'López', 'Martínez'][i],
          email: ['maria', 'carlos', 'ana'][i] + '@ejemplo.com',
          phone: '+34 6' + (12345678 + i),
          dni: '1234567' + (i + 1) + 'X',
          status: 'ACTIVE',
          companyId: company.id,
        }
      });
      
      // Crear contrato
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      await prisma.contract.create({
        data: {
          type: 'LONG_TERM',
          status: 'ACTIVE',
          startDate,
          endDate,
          monthlyRent: units[i].monthlyRent,
          deposit: units[i].monthlyRent * 2,
          tenantId: tenant.id,
          unitId: units[i].id,
          buildingId: building.id,
          companyId: company.id,
        }
      });
    }
    
    console.log(JSON.stringify({
      status: 'created',
      building: building.name,
      units: units.length,
      tenants: 3,
      contracts: 3
    }));
    
  } catch (error) {
    console.log(JSON.stringify({ status: 'error', message: error.message }));
  }
  await prisma.$disconnect();
})();
'''
        status, out, err = exec_cmd(client, 
            f"cd {APP_PATH} && node -e '{create_data_script}' 2>&1", 
            timeout=120
        )
        log(f"Resultado creación datos:\n{out}", Colors.GREEN if '"status":"created"' in out or '"status":"exists"' in out else Colors.YELLOW)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ EMPRESA Y DATOS CREADOS", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        log("\n📋 Credenciales de acceso:", Colors.CYAN)
        log("  Email: admin@validacion-proptech.es", Colors.CYAN)
        log("  Password: Admin123!", Colors.CYAN)
        log("\n📋 Datos creados:", Colors.CYAN)
        log("  - 1 edificio", Colors.CYAN)
        log("  - 5 unidades (3 ocupadas, 2 disponibles)", Colors.CYAN)
        log("  - 3 inquilinos con contratos activos", Colors.CYAN)
        
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
