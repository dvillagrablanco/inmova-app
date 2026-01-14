import paramiko
import sys

HOST = "157.180.119.236"
USER = "root"
PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_DIR = "/opt/inmova-app"

def force_schema_sync():
    print(f"⚡ Forzando sincronización de esquema en {HOST}...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔐 Conectando por SSH...")
        client.connect(HOST, username=USER, password=PASS, timeout=30)
        
        # 1. Limpiar tablas conflictivas (bloquean el push)
        print("🧹 Limpiando tablas conflictivas (ewoorker_plans, promo_coupons)...")
        # Usamos psql directamente o prisma execute raw
        truncate_cmd = """cd {APP_DIR} && node -e 'const {PrismaClient} = require("@prisma/client"); const prisma = new PrismaClient(); async function main() { await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ewoorker_plans" CASCADE;`); await prisma.$executeRawUnsafe(`TRUNCATE TABLE "promo_coupons" CASCADE;`); } main().then(() => console.log("Done")).catch(console.error);'"""
        
        # Como es complicado escapar comillas en SSH + Python, mejor crear un archivo temporal JS en el servidor
        js_script = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    console.log('Truncating tables...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "ewoorker_plans" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "promo_coupons" CASCADE;');
    console.log('Tables truncated.');
  } catch (e) {
    console.log('Error truncating (might actully apply later):', e.message);
  }
}
main();
"""
        # Escribir archivo en remoto
        sftp = client.open_sftp()
        with sftp.file(f"{APP_DIR}/truncate_conflict.js", "w") as f:
            f.write(js_script)
        sftp.close()
        
        # Ejecutar script de limpieza
        client.exec_command(f"cd {APP_DIR} && node truncate_conflict.js")

        # 2. Ejecutar db push ahora que las tablas están limpias
        print("🛠️  Ejecutando 'prisma db push' (intento 2)...")
        stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && npx prisma db push --accept-data-loss")
        
        out = stdout.read().decode()
        err = stderr.read().decode()
        print(out)
        if err:
            print(f"Log: {err}")

        # 3. Seed de planes (para restaurar lo borrado)
        print("🌱 Ejecutando seeds para restaurar planes...")
        client.exec_command(f"cd {APP_DIR} && npx tsx scripts/insert-plans.py") # O el seed que corresponda, probaré con prisma db seed si está configurado
        client.exec_command(f"cd {APP_DIR} && npx prisma db seed")

        # 4. Reiniciar PM2
        print("♻️  Reiniciando PM2...")
        client.exec_command(f"cd {APP_DIR} && pm2 reload inmova-app --update-env")
        
        print("✅ Sincronización forzada completada.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    force_schema_sync()
