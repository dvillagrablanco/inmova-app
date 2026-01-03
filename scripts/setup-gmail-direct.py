#!/usr/bin/env python3
"""Configurar Gmail SMTP directamente"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

# Gmail credentials
GMAIL_USER = input("📧 Email de Gmail (o Enter para usar predeterminado): ").strip()
if not GMAIL_USER:
    # Si no proporciona email, pedir confirmación
    print("⚠️  No proporcionaste email. ¿Cuál es tu email de Gmail?")
    GMAIL_USER = input("Email: ").strip()

GMAIL_APP_PASSWORD = 'eeemxyuasvsnyxyu'  # App password sin espacios

def exec_cmd(client, command, description=""):
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=60)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    
    if output:
        print(output)
    
    return exit_status, output

print("=" * 70)
print("📧 CONFIGURANDO GMAIL SMTP")
print("=" * 70)
print()
print(f"Email: {GMAIL_USER}")
print(f"App Password: {'*' * len(GMAIL_APP_PASSWORD)}")
print()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print("✅ Conectado al servidor\n")
    
    # 1. Backup
    print("1️⃣  Backup...")
    exec_cmd(
        client,
        f"cd {APP_PATH} && cp .env.local .env.local.backup_$(date +%Y%m%d_%H%M%S)",
        "Backup..."
    )
    print()
    
    # 2. Añadir/Actualizar variables SMTP
    print("2️⃣  Configurando variables SMTP...")
    
    smtp_config = f"""
# Gmail SMTP Configuration (added {time.strftime('%Y-%m-%d %H:%M:%S')})
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER={GMAIL_USER}
SMTP_PASS={GMAIL_APP_PASSWORD}
SMTP_FROM="Inmova App <{GMAIL_USER}>"
"""
    
    # Verificar si ya existe
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && grep -c 'SMTP_HOST' .env.local || echo '0'",
        "Verificando configuración existente..."
    )
    
    has_smtp = output.strip() != '0'
    
    if has_smtp:
        print("⚠️  Actualizando configuración SMTP existente...\n")
        
        # Actualizar cada variable
        commands = [
            f"sed -i 's|^SMTP_HOST=.*|SMTP_HOST=smtp.gmail.com|' .env.local",
            f"sed -i 's|^SMTP_PORT=.*|SMTP_PORT=587|' .env.local",
            f"sed -i 's|^SMTP_SECURE=.*|SMTP_SECURE=false|' .env.local",
            f"sed -i 's|^SMTP_USER=.*|SMTP_USER={GMAIL_USER}|' .env.local",
            f"sed -i 's|^SMTP_PASS=.*|SMTP_PASS={GMAIL_APP_PASSWORD}|' .env.local",
            f"sed -i 's|^SMTP_FROM=.*|SMTP_FROM=\"Inmova App <{GMAIL_USER}>\"|' .env.local",
        ]
        
        for cmd in commands:
            exec_cmd(client, f"cd {APP_PATH} && {cmd}", "")
    else:
        print("➕ Añadiendo nueva configuración SMTP...\n")
        
        safe_config = smtp_config.replace("'", "'\\''")
        exec_cmd(
            client,
            f"cd {APP_PATH} && echo '{safe_config}' >> .env.local",
            "Añadiendo..."
        )
    
    print("✅ Variables SMTP configuradas en .env.local\n")
    
    # 3. También en .env.production
    print("3️⃣  Actualizando .env.production...")
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && grep -c 'SMTP_HOST' .env.production || echo '0'",
        "Verificando..."
    )
    
    if output.strip() == '0':
        safe_config = smtp_config.replace("'", "'\\''")
        exec_cmd(
            client,
            f"cd {APP_PATH} && echo '{safe_config}' >> .env.production",
            "Añadiendo..."
        )
    else:
        exec_cmd(
            client,
            f"cd {APP_PATH} && sed -i 's|^SMTP_USER=.*|SMTP_USER={GMAIL_USER}|' .env.production",
            "Actualizando..."
        )
        exec_cmd(
            client,
            f"cd {APP_PATH} && sed -i 's|^SMTP_PASS=.*|SMTP_PASS={GMAIL_APP_PASSWORD}|' .env.production",
            "Actualizando password..."
        )
    
    print("✅ .env.production actualizado\n")
    
    # 4. Verificar
    print("4️⃣  Verificando configuración...")
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && grep -E '(SMTP_HOST|SMTP_USER|SMTP_FROM)' .env.local",
        "Variables configuradas:"
    )
    print()
    
    # 5. Reiniciar PM2
    print("5️⃣  Reiniciando PM2...")
    exec_cmd(client, "pm2 restart inmova-app", "pm2 restart...")
    print("✅ PM2 reiniciado\n")
    
    print("⏳ Esperando 20 segundos para warm-up...")
    time.sleep(20)
    
    # 6. Test de conexión SMTP
    print("\n6️⃣  TEST DE CONEXIÓN SMTP...")
    
    test_script = f"""
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {{
    user: '{GMAIL_USER}',
    pass: '{GMAIL_APP_PASSWORD}'
  }}
}});

transporter.verify()
  .then(() => {{
    console.log('✅ Conexión SMTP exitosa');
    process.exit(0);
  }})
  .catch(err => {{
    console.error('❌ Error:', err.message);
    process.exit(1);
  }});
"""
    
    safe_script = test_script.replace("'", "'\\''")
    exec_cmd(
        client,
        f"echo '{safe_script}' > /tmp/test-smtp.js",
        "Creando script de test..."
    )
    
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && node /tmp/test-smtp.js",
        "Testeando conexión SMTP..."
    )
    
    print()
    
    if status == 0:
        print("✅ Test de conexión SMTP: EXITOSO\n")
        success = True
    else:
        print("⚠️  Test de conexión falló\n")
        print("   Posibles causas:")
        print("   - Nodemailer no instalado (ejecutar: npm install nodemailer)")
        print("   - App Password incorrecta")
        print("   - Verificación en 2 pasos no activada\n")
        success = False
    
    # Limpiar
    exec_cmd(client, "rm -f /tmp/test-smtp.js", "")
    
    # Resumen
    print("=" * 70)
    if success:
        print("✅ GMAIL SMTP CONFIGURADO Y VERIFICADO")
    else:
        print("⚠️  GMAIL SMTP CONFIGURADO (test falló)")
    print("=" * 70)
    print()
    print("📧 Configuración:")
    print(f"  Servidor: smtp.gmail.com:587")
    print(f"  Usuario: {GMAIL_USER}")
    print(f"  Remitente: Inmova App <{GMAIL_USER}>")
    print()
    
    if success:
        print("🧪 Testear envío de email:")
        print()
        print("  1. Registrar nuevo usuario → debe llegar email de bienvenida")
        print("  2. Recuperar contraseña → debe llegar email")
        print("  3. Ver logs: pm2 logs inmova-app | grep -i email")
    else:
        print("🔍 Verificar:")
        print()
        print("  1. Que nodemailer esté instalado:")
        print("     ssh root@157.180.119.236")
        print("     cd /opt/inmova-app")
        print("     npm list nodemailer")
        print()
        print("  2. Si no está instalado:")
        print("     npm install nodemailer")
        print("     pm2 restart inmova-app")
        print()
        print("  3. Verificar App Password en Gmail:")
        print("     https://myaccount.google.com/apppasswords")
    
    print()
    print("📊 Límites de Gmail:")
    print("  - Cuenta gratuita: 500 emails/día")
    print("  - Google Workspace: 2,000 emails/día")
    print()
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    client.close()
