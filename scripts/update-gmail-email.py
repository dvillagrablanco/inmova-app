#!/usr/bin/env python3
"""Actualizar email de Gmail en la configuración"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

GMAIL_USER = 'inmovaapp@gmail.com'
GMAIL_APP_PASSWORD = 'eeemxyuasvsnyxyu'

def exec_cmd(client, command, description="", timeout=60):
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    
    if output:
        print(output)
    
    return exit_status, output

print("=" * 70)
print("📧 ACTUALIZANDO EMAIL DE GMAIL")
print("=" * 70)
print()
print(f"Email: {GMAIL_USER}")
print()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print("✅ Conectado\n")
    
    # 1. Actualizar SMTP_USER en .env.local
    print("1️⃣  Actualizando .env.local...")
    exec_cmd(
        client,
        f"cd {APP_PATH} && sed -i 's|^SMTP_USER=.*|SMTP_USER={GMAIL_USER}|' .env.local",
        "Actualizando SMTP_USER..."
    )
    exec_cmd(
        client,
        f"cd {APP_PATH} && sed -i 's|^SMTP_FROM=.*|SMTP_FROM=\"Inmova App <{GMAIL_USER}>\"|' .env.local",
        "Actualizando SMTP_FROM..."
    )
    print("✅ .env.local actualizado\n")
    
    # 2. Actualizar .env.production
    print("2️⃣  Actualizando .env.production...")
    exec_cmd(
        client,
        f"cd {APP_PATH} && sed -i 's|^SMTP_USER=.*|SMTP_USER={GMAIL_USER}|' .env.production",
        "Actualizando SMTP_USER..."
    )
    exec_cmd(
        client,
        f"cd {APP_PATH} && sed -i 's|^SMTP_FROM=.*|SMTP_FROM=\"Inmova App <{GMAIL_USER}>\"|' .env.production",
        "Actualizando SMTP_FROM..."
    )
    print("✅ .env.production actualizado\n")
    
    # 3. Verificar configuración
    print("3️⃣  Verificando configuración...")
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && grep -E '(SMTP_HOST|SMTP_USER|SMTP_FROM)' .env.local",
        "Variables SMTP:"
    )
    print()
    
    # 4. Reiniciar PM2
    print("4️⃣  Reiniciando PM2...")
    exec_cmd(client, "pm2 restart inmova-app", "pm2 restart...")
    print("✅ PM2 reiniciado\n")
    
    print("⏳ Esperando 25 segundos para warm-up...")
    time.sleep(25)
    
    # 5. Test de conexión SMTP
    print("\n5️⃣  TEST DE CONEXIÓN SMTP...")
    
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

console.log('Verificando conexión SMTP...');

transporter.verify()
  .then(() => {{
    console.log('✅ Conexión SMTP exitosa');
    console.log('Gmail está listo para enviar emails');
    process.exit(0);
  }})
  .catch(err => {{
    console.error('❌ Error de conexión SMTP:', err.message);
    if (err.code === 'EAUTH') {{
      console.error('   → App Password incorrecta o verificación en 2 pasos no activada');
    }} else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION') {{
      console.error('   → Problema de red o puerto bloqueado');
    }}
    process.exit(1);
  }});
"""
    
    safe_script = test_script.replace("'", "'\\''")
    exec_cmd(
        client,
        f"echo '{safe_script}' > /tmp/test-gmail-smtp.js",
        "Creando script de test..."
    )
    
    status, output = exec_cmd(
        client,
        f"cd {APP_PATH} && node /tmp/test-gmail-smtp.js",
        "Ejecutando test..."
    )
    
    print()
    
    # Limpiar
    exec_cmd(client, "rm -f /tmp/test-gmail-smtp.js", "")
    
    # Resumen
    print("=" * 70)
    if status == 0 and '✅ Conexión SMTP exitosa' in output:
        print("✅ GMAIL SMTP CONFIGURADO Y FUNCIONANDO")
        print("=" * 70)
        print()
        print("📧 Configuración:")
        print(f"  Email: {GMAIL_USER}")
        print(f"  Servidor: smtp.gmail.com:587")
        print(f"  Remitente: Inmova App <{GMAIL_USER}>")
        print()
        print("🎉 La app ya puede enviar emails!")
        print()
        print("📬 Tipos de emails que se enviarán:")
        print("  ✉️  Bienvenida al registrarse")
        print("  ✉️  Verificación de email")
        print("  ✉️  Recuperación de contraseña")
        print("  ✉️  Notificaciones de pagos")
        print("  ✉️  Alertas de mantenimiento")
        print("  ✉️  Recordatorios de contratos")
        print()
        print("🧪 Testear:")
        print("  1. Registrar un nuevo usuario → debe llegar email")
        print("  2. Usar 'Olvidé mi contraseña' → debe llegar email")
        print("  3. Ver logs: pm2 logs inmova-app | grep -i email")
        print()
        print("📊 Límites:")
        print("  - Gmail gratuita: 500 emails/día")
        print("  - Suficiente para ~50-100 usuarios activos")
    else:
        print("⚠️  CONFIGURACIÓN APLICADA PERO TEST FALLÓ")
        print("=" * 70)
        print()
        print("📧 Variables configuradas:")
        print(f"  Email: {GMAIL_USER}")
        print(f"  Servidor: smtp.gmail.com:587")
        print()
        print("⚠️  Posibles problemas:")
        print()
        print("  1. App Password incorrecta")
        print("     → Verificar: https://myaccount.google.com/apppasswords")
        print("     → Debe ser exactamente: eeemxyuasvsnyxyu")
        print()
        print("  2. Verificación en 2 pasos no activada")
        print("     → Activar: https://myaccount.google.com/security")
        print()
        print("  3. Puerto 587 bloqueado")
        print("     → Test: telnet smtp.gmail.com 587")
        print()
        print("🔧 Comandos de debugging:")
        print("  ssh root@157.180.119.236")
        print("  cd /opt/inmova-app")
        print("  cat .env.local | grep SMTP")
        print("  node /tmp/test-gmail-smtp.js")
    
    print()
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    client.close()
