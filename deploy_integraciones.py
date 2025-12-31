#!/usr/bin/env python3
"""
Deployment automatizado del ecosistema de integraciones a producción
Servidor: 157.180.119.236
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "tu_password_aqui"  # Cambiar por el password real
APP_DIR = "/opt/inmova-app"

def run_command(ssh, command, description):
    """Ejecutar comando y mostrar output"""
    print(f"\n{'='*60}")
    print(f"📌 {description}")
    print(f"🔧 Comando: {command}")
    print(f"{'='*60}")
    
    stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)
    
    # Esperar a que termine
    exit_status = stdout.channel.recv_exit_status()
    
    # Obtener output
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    
    if output:
        print(output)
    
    if error and exit_status != 0:
        print(f"❌ ERROR: {error}")
        return False
    
    if exit_status == 0:
        print(f"✅ Completado exitosamente")
        return True
    else:
        print(f"❌ Falló con código: {exit_status}")
        return False

def main():
    print("🚀 DEPLOYMENT DE ECOSISTEMA DE INTEGRACIONES")
    print("=" * 60)
    print(f"Servidor: {SERVER_IP}")
    print(f"Usuario: {SERVER_USER}")
    print(f"Directorio: {APP_DIR}")
    print("=" * 60)
    
    try:
        # Conectar
        print("\n📡 Conectando al servidor...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Intentar conectar
        try:
            ssh.connect(
                SERVER_IP,
                username=SERVER_USER,
                password=SERVER_PASSWORD,
                timeout=10,
                look_for_keys=False,
                allow_agent=False
            )
            print("✅ Conectado exitosamente")
        except Exception as e:
            print(f"❌ Error conectando: {e}")
            print("\n💡 NOTA: Si el password no funciona, ejecuta manualmente:")
            print(f"   ssh {SERVER_USER}@{SERVER_IP}")
            return False
        
        # Paso 1: Verificar directorio
        if not run_command(ssh, f"cd {APP_DIR} && pwd", "Verificar directorio de app"):
            print(f"❌ No se puede acceder a {APP_DIR}")
            return False
        
        # Paso 2: Git pull
        if not run_command(ssh, f"cd {APP_DIR} && git pull origin main", "Pull código de GitHub"):
            print("⚠️ Git pull falló, pero continuamos...")
        
        # Paso 3: Instalar dependencias
        if not run_command(ssh, f"cd {APP_DIR} && yarn install", "Instalar dependencias con Yarn"):
            print("❌ Instalación de dependencias falló")
            return False
        
        # Paso 4: Generar Prisma Client
        if not run_command(ssh, f"cd {APP_DIR} && npx prisma generate", "Generar Prisma Client"):
            print("❌ Generación de Prisma Client falló")
            return False
        
        # Paso 5: Aplicar migraciones (si hay)
        print("\n⚠️ Aplicando migraciones de Prisma...")
        run_command(ssh, f"cd {APP_DIR} && npx prisma migrate deploy", "Aplicar migraciones de BD")
        
        # Paso 6: Verificar PM2
        print("\n🔍 Verificando PM2...")
        stdin, stdout, stderr = ssh.exec_command("which pm2")
        pm2_path = stdout.read().decode('utf-8').strip()
        
        if pm2_path:
            print(f"✅ PM2 encontrado en: {pm2_path}")
            
            # Restart con PM2
            if not run_command(ssh, "pm2 restart inmova-app", "Restart app con PM2"):
                print("⚠️ PM2 restart falló, intentando start...")
                run_command(ssh, f"cd {APP_DIR} && pm2 start ecosystem.config.js", "Start app con PM2")
            
            time.sleep(5)
            
            # Ver logs
            run_command(ssh, "pm2 logs inmova-app --lines 20 --nostream", "Ver logs de PM2")
        else:
            print("⚠️ PM2 no encontrado")
            
            # Intentar restart manual
            print("\n🔄 Intentando restart manual...")
            run_command(ssh, "pkill -f 'next-server'", "Matar procesos Next.js")
            time.sleep(2)
            run_command(ssh, f"cd {APP_DIR} && nohup yarn start > /tmp/inmova.log 2>&1 &", "Iniciar app manualmente")
        
        # Paso 7: Health check
        print("\n🏥 Esperando 10 segundos para health check...")
        time.sleep(10)
        
        if not run_command(ssh, "curl -s http://localhost:3000/api/health", "Health check interno"):
            print("⚠️ Health check falló")
        
        # Paso 8: Verificar procesos
        run_command(ssh, "ps aux | grep -i next | grep -v grep | head -5", "Verificar procesos Next.js")
        
        # Cerrar conexión
        ssh.close()
        
        print("\n" + "=" * 60)
        print("✅ DEPLOYMENT COMPLETADO")
        print("=" * 60)
        print("\n🔍 VERIFICACIONES MANUALES:")
        print("1. Abrir: https://inmovaapp.com/api/health")
        print("2. Abrir: https://inmovaapp.com/api-docs")
        print("3. Abrir: https://inmovaapp.com/dashboard/integrations")
        print("4. Crear API Key desde dashboard")
        print("5. Test API: curl -H 'Authorization: Bearer sk_live_...' https://inmovaapp.com/api/v1/properties")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR GENERAL: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
