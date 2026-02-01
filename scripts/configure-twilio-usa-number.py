#!/usr/bin/env python3
"""
Configurar número de teléfono de USA en Twilio para Inmova
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import json

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print("=" * 70)
    print("📞 CONFIGURANDO NÚMERO USA EN TWILIO")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado al servidor\n")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return
    
    try:
        # Obtener credenciales de Twilio
        print("📋 Obteniendo credenciales de Twilio...")
        status, output, _ = exec_cmd(client, f"grep -E 'TWILIO_ACCOUNT_SID|TWILIO_AUTH_TOKEN' {APP_PATH}/.env.production")
        
        credentials = {}
        for line in output.strip().split('\n'):
            if '=' in line:
                key, value = line.split('=', 1)
                credentials[key.strip()] = value.strip()
        
        account_sid = credentials.get('TWILIO_ACCOUNT_SID', '')
        auth_token = credentials.get('TWILIO_AUTH_TOKEN', '')
        
        if not account_sid or not auth_token:
            print("❌ No se encontraron credenciales de Twilio")
            return
        
        print(f"  ✅ Account SID: {account_sid[:10]}...")
        print(f"  ✅ Auth Token: {auth_token[:8]}...")
        
        # Crear script para interactuar con la API de Twilio
        twilio_script = f'''
import os
import sys

# Instalar twilio si no está
try:
    from twilio.rest import Client
except ImportError:
    os.system('pip3 install twilio -q')
    from twilio.rest import Client

account_sid = "{account_sid}"
auth_token = "{auth_token}"

client = Client(account_sid, auth_token)

# Listar números disponibles en USA
print("\\n📱 Buscando números disponibles en USA...")
try:
    # Buscar números toll-free (sin cargo para quien llama)
    available_numbers = client.available_phone_numbers("US").toll_free.list(
        voice_enabled=True,
        sms_enabled=True,
        limit=5
    )
    
    if available_numbers:
        print("\\n✅ Números toll-free disponibles:")
        for num in available_numbers:
            print(f"   {{num.phone_number}} - {{num.friendly_name}}")
        
        # También buscar números locales
        local_numbers = client.available_phone_numbers("US").local.list(
            voice_enabled=True,
            area_code="305",  # Miami
            limit=5
        )
        
        if local_numbers:
            print("\\n✅ Números locales (Miami 305) disponibles:")
            for num in local_numbers:
                print(f"   {{num.phone_number}}")
    else:
        print("   No se encontraron números toll-free")
        
except Exception as e:
    print(f"Error buscando números: {{e}}")

# Listar números actuales en la cuenta
print("\\n📋 Números actuales en la cuenta:")
try:
    incoming_numbers = client.incoming_phone_numbers.list(limit=10)
    
    if incoming_numbers:
        for num in incoming_numbers:
            print(f"   {{num.phone_number}} - {{num.friendly_name or 'Sin nombre'}}")
            print(f"      Voice URL: {{num.voice_url or 'No configurado'}}")
    else:
        print("   No hay números en la cuenta")
        
except Exception as e:
    print(f"Error listando números: {{e}}")

print("\\n" + "="*50)
print("INSTRUCCIONES:")
print("="*50)
print("""
Para comprar un número de USA:

1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/search

2. Busca un número:
   - País: United States
   - Tipo: Toll-Free (recomendado) o Local
   - Capabilities: Voice + SMS
   
3. Compra el número (~$2/mes toll-free, ~$1/mes local)

4. Configura el webhook de voz:
   Voice URL: https://inmovaapp.com/api/vapi/webhook
   Method: POST
   
5. Actualiza .env.production:
   NEXT_PUBLIC_VAPI_PHONE_NUMBER=+1XXXXXXXXXX
   TWILIO_PHONE_NUMBER_USA=+1XXXXXXXXXX
""")
'''
        
        # Ejecutar script de Twilio
        print("\n🔍 Consultando API de Twilio...")
        
        # Guardar y ejecutar script
        exec_cmd(client, f"cat > /tmp/check_twilio.py << 'PYEOF'\n{twilio_script}\nPYEOF")
        status, output, error = exec_cmd(client, "cd /tmp && python3 check_twilio.py", timeout=120)
        
        print(output)
        if error:
            print(f"Errores: {error}")
        
        # Mostrar resumen final
        print("\n" + "=" * 70)
        print("📊 RESUMEN DE CONFIGURACIÓN")
        print("=" * 70)
        print(f"""
Para completar la configuración:

1. COMPRAR NÚMERO USA:
   - Dashboard: https://console.twilio.com/
   - Credenciales ya configuradas ✅
   - Recomendado: Toll-Free para profesionalidad

2. CONFIGURAR VAPI:
   - Dashboard: https://dashboard.vapi.ai/
   - Crear asistente "Ana - Recepcionista"
   - Asignar número de teléfono

3. ACTUALIZAR SERVIDOR:
   ssh root@{SERVER_IP}
   echo "NEXT_PUBLIC_VAPI_PHONE_NUMBER=+1XXXXXXXXXX" >> {APP_PATH}/.env.production
   echo "TWILIO_PHONE_NUMBER_USA=+1XXXXXXXXXX" >> {APP_PATH}/.env.production
   pm2 restart inmova-app --update-env

4. WEBHOOK DE VOZ:
   En Twilio Console > Phone Numbers > [Tu número]:
   Voice URL: https://inmovaapp.com/api/vapi/webhook
   Method: POST

El número aparecerá en la app automáticamente.
""")
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
