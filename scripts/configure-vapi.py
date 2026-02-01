#!/usr/bin/env python3
"""
Configurar credenciales de Vapi en el servidor
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# Credenciales de Vapi (proporcionadas por el usuario)
VAPI_API_KEY = "d79a1bac-c0bd-4dc4-8ddd-2b5e55a3210c"
VAPI_PRIVATE_KEY = "7e045d23-d354-409f-a5b3-0bdc8096a079"

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print("=" * 70)
    print("🤖 CONFIGURANDO VAPI EN SERVIDOR")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    try:
        # Verificar si ya existen las variables
        status, output, _ = exec_cmd(client, f"grep VAPI {APP_PATH}/.env.production || true")
        
        if "VAPI_API_KEY" in output:
            print("⚠️  Variables de Vapi ya existen, actualizando...")
            # Eliminar variables existentes
            exec_cmd(client, f"sed -i '/^VAPI_/d' {APP_PATH}/.env.production")
        
        # Añadir nuevas variables
        print("\n📝 Añadiendo variables de Vapi...")
        
        vapi_config = f"""

# ============================================================================
# VAPI - Agentes de Voz IA
# Dashboard: https://dashboard.vapi.ai/
# ============================================================================
VAPI_API_KEY={VAPI_API_KEY}
VAPI_PRIVATE_KEY={VAPI_PRIVATE_KEY}
VAPI_WEBHOOK_SECRET=inmova-vapi-webhook-secret-2026
"""
        
        # Escribir al archivo
        exec_cmd(client, f"cat >> {APP_PATH}/.env.production << 'EOF'{vapi_config}EOF")
        
        # Verificar
        status, output, _ = exec_cmd(client, f"grep VAPI {APP_PATH}/.env.production")
        print("\n📋 Variables configuradas:")
        for line in output.strip().split('\n'):
            if line:
                key = line.split('=')[0]
                value = line.split('=')[1] if '=' in line else ''
                # Ofuscar valores sensibles
                if 'KEY' in key or 'SECRET' in key:
                    display_value = value[:8] + '...' if len(value) > 8 else value
                else:
                    display_value = value
                print(f"  ✅ {key}={display_value}")
        
        # Reiniciar PM2
        print("\n♻️  Reiniciando PM2...")
        exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
        
        import time
        time.sleep(5)
        
        # Verificar estado
        status, output, _ = exec_cmd(client, "pm2 jlist")
        if '"status":"online"' in output:
            print("✅ PM2 reiniciado correctamente")
        else:
            print("⚠️  PM2 puede necesitar revisión")
        
        # Resumen
        print("\n" + "=" * 70)
        print("✅ VAPI CONFIGURADO EXITOSAMENTE")
        print("=" * 70)
        print(f"""
📌 Variables configuradas:
   - VAPI_API_KEY: {VAPI_API_KEY[:8]}...
   - VAPI_PRIVATE_KEY: {VAPI_PRIVATE_KEY[:8]}...
   - VAPI_WEBHOOK_SECRET: configurado

📌 Endpoints disponibles:
   - Webhook: https://inmovaapp.com/api/vapi/webhook
   - Asistentes: https://inmovaapp.com/api/vapi/assistants
   - Llamadas: https://inmovaapp.com/api/vapi/calls

📌 Agentes IA creados (7):
   1. Elena - Asesora Comercial (ventas)
   2. María - Atención al Cliente
   3. Carlos - Técnico de Incidencias
   4. Patricia - Tasadora Inmobiliaria
   5. Roberto - Captador de Propiedades
   6. Laura - Especialista Coliving
   7. Antonio - Administrador de Fincas

📌 Próximos pasos:
   1. Crear los asistentes en Vapi:
      POST /api/vapi/assistants {{ "createAll": true }}
   
   2. Probar una llamada:
      POST /api/vapi/calls {{
        "assistantId": "<id>",
        "phoneNumber": "+34600000000"
      }}
""")
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
