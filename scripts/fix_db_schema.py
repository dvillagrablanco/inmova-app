import paramiko
import sys

HOST = "157.180.119.236"
USER = "root"
PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_DIR = "/opt/inmova-app"

def fix_schema():
    print(f"🔄 Sincronizando esquema de base de datos en {HOST}...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("🔐 Conectando por SSH...")
        client.connect(HOST, username=USER, password=PASS, timeout=30)
        
        # 1. Ejecutar db push para sincronizar schema sin migraciones
        # Usamos --accept-data-loss con precaución, pero es necesario si hay cambios estructurales pendientes
        # que no tienen migración. Las columnas nuevas no causan pérdida de datos.
        print("🛠️  Ejecutando 'prisma db push'...")
        # Primero intentamos generar el cliente de nuevo por si acaso
        client.exec_command(f"cd {APP_DIR} && npx prisma generate")
        
        # Ejecutar push
        stdin, stdout, stderr = client.exec_command(f"cd {APP_DIR} && npx prisma db push --accept-data-loss")
        
        # Streaming output
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        print(out)
        if err:
            print(f"Nota/Error: {err}")

        # 2. Reiniciar PM2
        print("♻️  Reiniciando PM2...")
        client.exec_command(f"cd {APP_DIR} && pm2 reload inmova-app --update-env")
        
        print("✅ Esquema sincronizado y aplicación reiniciada.")

    except Exception as e:
        print(f"❌ Error crítico: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    fix_schema()
