import paramiko
import time
import sys
import os

# Configuración proporcionada por el usuario
HOST = "157.180.119.236"
USER = "root"
PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_DIR = "/opt/inmova-app"

def run_command(client, command, stop_on_error=True):
    print(f"\n🚀 Ejecutando: {command}")
    stdin, stdout, stderr = client.exec_command(command)
    
    # Esperar y mostrar salida en tiempo real
    while True:
        line = stdout.readline()
        if not line:
            break
        print(f"   {line.strip()}")
        
    exit_status = stdout.channel.recv_exit_status()
    
    if exit_status != 0:
        error_msg = stderr.read().decode().strip()
        print(f"❌ Error (Exit code {exit_status}):")
        print(f"   {error_msg}")
        if stop_on_error:
            raise Exception(f"Comando falló: {command}")
        return False
    return True

def deploy():
    print(f"🔄 Iniciando despliegue directo a {HOST}...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # 1. Conexión
        print("🔐 Conectando por SSH...")
        client.connect(HOST, username=USER, password=PASS, timeout=30)
        print("✅ Conexión establecida.")

        # 2. Verificar directorio
        print("📂 Verificando directorio de la aplicación...")
        check_dir = f"test -d {APP_DIR} && echo 'exists'"
        stdin, stdout, stderr = client.exec_command(check_dir)
        if 'exists' not in stdout.read().decode():
            raise Exception(f"El directorio {APP_DIR} no existe en el servidor.")

        # 3. Git Operations
        # Forzamos fetch y reset para asegurar que tenemos EXACTAMENTE lo que está en main
        run_command(client, f"cd {APP_DIR} && git fetch origin main")
        run_command(client, f"cd {APP_DIR} && git reset --hard origin/main")
        
        # 4. Instalación de dependencias (solo si package.json cambió, pero por seguridad lo corremos)
        # Usamos npm ci para instalaciones limpias si existe package-lock, o npm install
        run_command(client, f"cd {APP_DIR} && npm install --legacy-peer-deps") # legacy-peer-deps por si acaso hay conflictos viejos

        # 5. Prisma
        run_command(client, f"cd {APP_DIR} && npx prisma generate")
        # Opcional: migraciones (con cuidado en producción)
        # run_command(client, f"cd {APP_DIR} && npx prisma migrate deploy", stop_on_error=False)

        # 6. Build
        print("🏗️  Construyendo aplicación (esto puede tardar)...")
        # Aumentamos memoria para node si es necesario
        run_command(client, f"cd {APP_DIR} && NODE_OPTIONS='--max-old-space-size=4096' npm run build")

        # 7. Reinicio de PM2
        print("♻️  Reiniciando servicio PM2...")
        # Intentamos reload primero (zero downtime), si falla, restart
        try:
            run_command(client, f"cd {APP_DIR} && pm2 reload inmova-app --update-env")
        except:
            print("⚠️ 'pm2 reload' falló, intentando 'pm2 restart'...")
            run_command(client, f"cd {APP_DIR} && pm2 restart inmova-app --update-env")

        print("\n✨ Despliegue finalizado exitosamente.")
        
    except paramiko.AuthenticationException:
        print("❌ Error de autenticación: Verifica usuario y contraseña.")
    except Exception as e:
        print(f"\n❌ Error crítico durante el despliegue: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
