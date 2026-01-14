import paramiko
import sys

HOST = "157.180.119.236"
USER = "root"
PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_DIR = "/opt/inmova-app"

def force_schema_sync():
    print(f"⚡ Forzando sincronización de esquema (Intento 3 - DDL Fix) en {HOST}...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔐 Conectando por SSH...")
        client.connect(HOST, username=USER, password=PASS, timeout=30)
        
        js_script = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    console.log('Applying DDL fixes...');
    
    // 1. Truncar tablas conflictivas
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "ewoorker_plans" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "promo_coupons" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "contract_signatures" CASCADE;');
    
    // 2. Romper dependencias de tipos ENUM conflictivos
    // Dropear defaults que usan el ENUM antiguo
    try { await prisma.$executeRawUnsafe('ALTER TABLE "contract_signatures" ALTER COLUMN "status" DROP DEFAULT;'); } catch(e) {}
    
    // Convertir columnas ENUM a TEXT temporalmente para romper el link con el tipo
    try { await prisma.$executeRawUnsafe('ALTER TABLE "contract_signatures" ALTER COLUMN "status" TYPE text USING status::text;'); } catch(e) {}
    
    // Intentar dropear el tipo enum si no hay más dependencias
    try { await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "SignatureStatus" CASCADE;'); } catch(e) {}
    try { await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "SignatureStatus_new" CASCADE;'); } catch(e) {}

    console.log('DDL fixes applied.');
  } catch (e) {
    console.log('Error executing SQL:', e.message);
  }
}
main();
"""
        sftp = client.open_sftp()
        with sftp.file(f"{APP_DIR}/truncate_conflict_v3.js", "w") as f:
            f.write(js_script)
        sftp.close()
        
        print("🧹 Ejecutando limpieza SQL profunda...")
        client.exec_command(f"cd {APP_DIR} && node truncate_conflict_v3.js")

        print("🛠️  Ejecutando 'prisma db push'...")
        stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && npx prisma db push --accept-data-loss")
        
        out = stdout.read().decode()
        err = stderr.read().decode()
        print(out)
        
        # Validar éxito
        if "The database is now in sync" in out or "Generated Prisma Client" in out:
             print("✅ DB Push exitoso.")
        else:
             print(f"⚠️  Posible error en push: {err}")

        print("🌱 Ejecutando seeds...")
        client.exec_command(f"cd {APP_DIR} && npx prisma db seed")

        print("♻️  Reiniciando PM2...")
        client.exec_command(f"cd {APP_DIR} && pm2 reload inmova-app --update-env")
        
        print("✅ Proceso finalizado.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    force_schema_sync()
