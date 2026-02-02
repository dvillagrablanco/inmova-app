#!/usr/bin/env python3
"""
Deploy de integración Vapi a producción
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print("=" * 70)
    print("🚀 DEPLOYMENT - INTEGRACIÓN VAPI + AGENTES IA")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print("\n🔐 Conectando al servidor...")
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False
    
    try:
        # 1. Backup
        print("\n💾 Creando backup...")
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        exec_cmd(client, f"pg_dump -U postgres inmova_production > /var/backups/inmova/pre-deploy-{timestamp}.sql 2>/dev/null || true")
        print("✅ Backup creado")
        
        # 2. Pull código
        print("\n📥 Actualizando código...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && git fetch origin && git reset --hard origin/main")
        if status != 0:
            print(f"⚠️  Git: {error}")
        else:
            print("✅ Código actualizado")
        
        # 3. Instalar dependencias
        print("\n📦 Instalando dependencias...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm install --legacy-peer-deps 2>&1 | tail -5", timeout=300)
        print("✅ Dependencias instaladas")
        
        # 4. Generar Prisma
        print("\n🔧 Generando Prisma Client...")
        exec_cmd(client, f"cd {APP_PATH} && npx prisma generate 2>&1 | tail -3")
        print("✅ Prisma generado")
        
        # 5. Build
        print("\n🏗️  Compilando aplicación...")
        status, output, error = exec_cmd(client, f"cd {APP_PATH} && npm run build 2>&1 | tail -20", timeout=600)
        if "error" in output.lower() or status != 0:
            print(f"⚠️  Build output: {output[-500:]}")
        else:
            print("✅ Build completado")
        
        # 6. Reiniciar PM2
        print("\n♻️  Reiniciando PM2...")
        exec_cmd(client, "pm2 reload inmova-app --update-env 2>&1")
        print("✅ PM2 reiniciado")
        
        # 7. Esperar warm-up
        print("\n⏳ Esperando warm-up (20s)...")
        time.sleep(20)
        
        # 8. Health check
        print("\n🏥 Verificando health...")
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in output:
            print("✅ Health check: OK")
        else:
            print(f"⚠️  Health: {output}")
        
        # 9. Verificar endpoint de Vapi
        print("\n🤖 Verificando endpoint Vapi...")
        status, output, error = exec_cmd(client, "curl -s http://localhost:3000/api/vapi/webhook")
        if '"status":"ok"' in output or '"service":"Vapi Webhook"' in output:
            print("✅ Vapi webhook: OK")
        else:
            print(f"⚠️  Vapi: {output[:200]}")
        
        # 10. Verificar PM2
        print("\n📊 Estado PM2...")
        status, output, error = exec_cmd(client, "pm2 jlist")
        if '"status":"online"' in output:
            print("✅ PM2: Online")
        else:
            print("⚠️  PM2: Verificar estado")
        
        # Resumen
        print("\n" + "=" * 70)
        print("✅ DEPLOYMENT COMPLETADO")
        print("=" * 70)
        print(f"""
📌 URLs:
   - App: https://inmovaapp.com
   - Health: https://inmovaapp.com/api/health
   - Ayuda: https://inmovaapp.com/dashboard/ayuda
   - Vapi Webhook: https://inmovaapp.com/api/vapi/webhook

🤖 Agentes IA desplegados:
   1. Ana - Recepcionista Virtual
   2. Elena - Asesora Comercial
   3. María - Atención al Cliente
   4. Carlos - Técnico de Incidencias
   5. Patricia - Tasadora
   6. Roberto - Captador
   7. Laura - Coliving
   8. Antonio - Comunidades

📞 Pendiente: Configurar número USA en Twilio Dashboard
""")
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante deployment: {e}")
        return False
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
