import paramiko
import sys

HOST = "157.180.119.236"
USER = "root"
PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_DIR = "/opt/inmova-app"

def run_migration():
    print(f"🔄 Reparando base de datos en {HOST}...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔐 Conectando por SSH...")
        client.connect(HOST, username=USER, password=PASS, timeout=30)
        
        # 1. Ejecutar migraciones pendientes
        print("🛠️  Ejecutando 'prisma migrate deploy'...")
        stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && npx prisma migrate deploy")
        
        # Mostrar salida
        print(stdout.read().decode())
        err = stderr.read().decode()
        if err:
            print(f"⚠️  Salida stderr (puede ser info o error):\n{err}")

        # 2. Reiniciar PM2 para limpiar conexiones viejas
        print("♻️  Reiniciando PM2...")
        client.exec_command(f"cd {APP_DIR} && pm2 reload inmova-app --update-env")
        
        print("✅ Proceso completado. La base de datos debería estar sincronizada.")

    except Exception as e:
        print(f"❌ Error crítico: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run_migration()
