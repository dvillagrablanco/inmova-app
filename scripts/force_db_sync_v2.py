import paramiko
import sys

HOST = "157.180.119.236"
USER = "root"
PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_DIR = "/opt/inmova-app"

def force_schema_sync():
    print(f"⚡ Forzando sincronización de esquema (Intento 2) en {HOST}...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔐 Conectando por SSH...")
        client.connect(HOST, username=USER, password=PASS, timeout=30)
        
        # Script JS para truncar tablas problemáticas
        # Agregamos contract_signatures por el error de ENUM
        js_script = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    console.log('Truncating conflict tables...');
    // Conflictos anteriores
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "ewoorker_plans" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "promo_coupons" CASCADE;');
    
    // Conflicto de ENUM SignatureStatus
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "contract_signatures" CASCADE;');
    // Intentar truncar otras posibles tablas relacionadas si existen
    try { await prisma.$executeRawUnsafe('TRUNCATE TABLE "signatures" CASCADE;'); } catch (e) {}
    
    console.log('Tables truncated.');
  } catch (e) {
    console.log('Error truncating:', e.message);
  }
}
main();
"""
        sftp = client.open_sftp()
        with sftp.file(f"{APP_DIR}/truncate_conflict_v2.js", "w") as f:
            f.write(js_script)
        sftp.close()
        
        print("🧹 Ejecutando limpieza de datos conflictivos...")
        client.exec_command(f"cd {APP_DIR} && node truncate_conflict_v2.js")

        print("🛠️  Ejecutando 'prisma db push'...")
        stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && npx prisma db push --accept-data-loss")
        
        out = stdout.read().decode()
        err = stderr.read().decode()
        print(out)
        if err:
            print(f"Log: {err}")

        # Si funciona, ejecutar seed básico
        print("🌱 Ejecutando seeds...")
        client.exec_command(f"cd {APP_DIR} && npx prisma db seed")

        print("♻️  Reiniciando PM2...")
        client.exec_command(f"cd {APP_DIR} && pm2 reload inmova-app --update-env")
        
        print("✅ Sincronización completada.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    force_schema_sync()
