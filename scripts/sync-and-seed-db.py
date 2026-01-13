#!/usr/bin/env python3
"""
Sincronizar schema de Prisma y cargar datos semilla
"""
import sys
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

def exec_cmd(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, out, err

# Script TypeScript para cargar datos semilla
SEED_SCRIPT = '''
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');
  
  // 1. Crear planes de suscripción si no existen
  const existingPlans = await prisma.subscriptionPlan.count();
  if (existingPlans === 0) {
    console.log('📋 Creando planes de suscripción...');
    
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          id: 'plan-free',
          nombre: 'Free',
          tier: 'FREE',
          descripcion: 'Plan gratuito para probar la plataforma',
          precioMensual: 0,
          maxUsuarios: 1,
          maxPropiedades: 3,
          modulosIncluidos: ['dashboard', 'propiedades'],
          activo: true,
          signaturesIncludedMonth: 0,
          storageIncludedGB: 1,
          aiTokensIncludedMonth: 0,
          smsIncludedMonth: 0,
        },
        {
          id: 'plan-starter',
          nombre: 'Starter',
          tier: 'STARTER',
          descripcion: 'Para propietarios individuales',
          precioMensual: 29,
          maxUsuarios: 2,
          maxPropiedades: 10,
          modulosIncluidos: ['dashboard', 'propiedades', 'inquilinos', 'contratos', 'pagos'],
          activo: true,
          popular: true,
          signaturesIncludedMonth: 5,
          storageIncludedGB: 5,
          aiTokensIncludedMonth: 1000,
          smsIncludedMonth: 50,
        },
        {
          id: 'plan-professional',
          nombre: 'Professional',
          tier: 'PROFESSIONAL',
          descripcion: 'Para gestores profesionales',
          precioMensual: 79,
          maxUsuarios: 5,
          maxPropiedades: 50,
          modulosIncluidos: ['dashboard', 'propiedades', 'inquilinos', 'contratos', 'pagos', 'mantenimiento', 'documentos', 'crm'],
          activo: true,
          signaturesIncludedMonth: 20,
          storageIncludedGB: 25,
          aiTokensIncludedMonth: 5000,
          smsIncludedMonth: 200,
        },
        {
          id: 'plan-business',
          nombre: 'Business',
          tier: 'BUSINESS',
          descripcion: 'Para empresas medianas',
          precioMensual: 199,
          maxUsuarios: 15,
          maxPropiedades: 200,
          modulosIncluidos: ['dashboard', 'propiedades', 'inquilinos', 'contratos', 'pagos', 'mantenimiento', 'documentos', 'crm', 'comunidades', 'analytics'],
          activo: true,
          signaturesIncludedMonth: 50,
          storageIncludedGB: 100,
          aiTokensIncludedMonth: 20000,
          smsIncludedMonth: 500,
        },
        {
          id: 'plan-enterprise',
          nombre: 'Enterprise',
          tier: 'ENTERPRISE',
          descripcion: 'Solución personalizada para grandes empresas',
          precioMensual: 499,
          maxUsuarios: 1000,
          maxPropiedades: 10000,
          modulosIncluidos: ['all'],
          activo: true,
          signaturesIncludedMonth: 200,
          storageIncludedGB: 1000,
          aiTokensIncludedMonth: 100000,
          smsIncludedMonth: 2000,
        },
      ],
    });
    console.log('✅ Planes creados');
  } else {
    console.log('ℹ️ Ya existen planes');
  }

  // 2. Crear empresa de validación si no existe
  const testCompany = await prisma.company.findFirst({
    where: { nombre: 'Validación PropTech S.L.' }
  });
  
  if (!testCompany) {
    console.log('🏢 Creando empresa de validación...');
    
    const company = await prisma.company.create({
      data: {
        nombre: 'Validación PropTech S.L.',
        cif: 'B12345678',
        direccion: 'Calle Gran Vía 123, Madrid',
        telefono: '+34 912 345 678',
        email: 'info@validacion-proptech.es',
        ciudad: 'Madrid',
        pais: 'España',
        codigoPostal: '28013',
        activo: true,
        businessVertical: 'alquiler_tradicional',
        maxUsuarios: 10,
        maxPropiedades: 50,
        subscriptionPlanId: 'plan-professional',
      },
    });
    console.log('✅ Empresa creada:', company.id);
  } else {
    console.log('ℹ️ Empresa de validación ya existe');
  }

  console.log('\\n✅ Seed completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
'''

def main():
    log("=" * 70, Colors.CYAN)
    log("🔄 SINCRONIZACIÓN Y SEED DE BASE DE DATOS", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
        
        # 1. Backup de BD
        log("\n💾 [1/5] Creando backup de BD...", Colors.BLUE)
        timestamp = int(time.time())
        exec_cmd(client, 
            f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && pg_dump "$DB_URL" > /tmp/backup-pre-sync-{timestamp}.sql 2>/dev/null || echo "Backup completado"'''
        )
        log("  ✅ Backup creado", Colors.GREEN)
        
        # 2. Sincronizar schema
        log("\n🔧 [2/5] Sincronizando schema de Prisma...", Colors.BLUE)
        log("  (esto puede tomar unos minutos)", Colors.YELLOW)
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && npx prisma db push --accept-data-loss 2>&1''',
            timeout=600
        )
        if "Your database is now in sync" in out or "applied" in out.lower():
            log("  ✅ Schema sincronizado", Colors.GREEN)
        else:
            log(f"  ⚠️ Output: {out[-500:]}", Colors.YELLOW)
        
        # 3. Regenerar cliente Prisma
        log("\n🔄 [3/5] Regenerando cliente Prisma...", Colors.BLUE)
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate")
        log("  ✅ Cliente regenerado", Colors.GREEN)
        
        # 4. Ejecutar seed
        log("\n🌱 [4/5] Ejecutando seed de datos...", Colors.BLUE)
        
        # Crear archivo de seed
        seed_cmd = f'''cat > {APP_PATH}/seed-data.ts << 'SEED_EOF'
{SEED_SCRIPT}
SEED_EOF'''
        exec_cmd(client, seed_cmd)
        
        # Ejecutar seed
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && npx tsx seed-data.ts 2>&1''',
            timeout=120
        )
        log(f"\n{out}", Colors.CYAN)
        
        # Limpiar archivo temporal
        exec_cmd(client, f"rm -f {APP_PATH}/seed-data.ts")
        
        # 5. Reiniciar app
        log("\n🔄 [5/5] Reiniciando aplicación...", Colors.BLUE)
        exec_cmd(client, "pm2 restart inmova-app")
        time.sleep(10)
        
        # Verificar
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in out:
            log("  ✅ App reiniciada correctamente", Colors.GREEN)
        else:
            log(f"  ⚠️ Health: {out[:200]}", Colors.YELLOW)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ SINCRONIZACIÓN Y SEED COMPLETADOS", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
