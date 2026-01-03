#!/usr/bin/env python3
"""
Configurar Gmail SMTP como alternativa a SendGrid
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

# Usuario debe proporcionar
GMAIL_USER = "PENDIENTE"  # tu-email@gmail.com
GMAIL_APP_PASSWORD = "PENDIENTE"  # App password de 16 caracteres

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return {
        'exit': exit_status,
        'output': stdout.read().decode('utf-8', errors='ignore'),
        'error': stderr.read().decode('utf-8', errors='ignore')
    }

def main():
    print("=" * 70)
    print("📧 CONFIGURANDO GMAIL SMTP")
    print("=" * 70)
    print()
    
    if GMAIL_USER == "PENDIENTE" or GMAIL_APP_PASSWORD == "PENDIENTE":
        print("❌ Faltan credenciales de Gmail")
        print()
        print("Para obtener App Password de Gmail:")
        print()
        print("1. Ve a: https://myaccount.google.com/security")
        print("2. Activa 'Verificación en 2 pasos' (si no está)")
        print("3. Ve a: https://myaccount.google.com/apppasswords")
        print("4. Nombre: 'Inmova App'")
        print("5. Click 'Generar'")
        print("6. Copia la contraseña de 16 caracteres")
        print()
        print("Luego ejecuta:")
        print("python3 configure-gmail-smtp.py \\")
        print("  --email tu-email@gmail.com \\")
        print("  --password xxxx-xxxx-xxxx-xxxx")
        print()
        return 1
    
    print("📋 Credenciales:")
    print(f"   Email: {GMAIL_USER}")
    print(f"   Password: {'*' * len(GMAIL_APP_PASSWORD)}")
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("[1/4] Eliminando configuración de email anterior...")
    exec_cmd(client, "cd /opt/inmova-app && sed -i '/^SENDGRID/d' .env.production")
    exec_cmd(client, "cd /opt/inmova-app && sed -i '/^SMTP/d' .env.production")
    print("   ✅ Limpieza completada")
    print()
    
    print("[2/4] Configurando Gmail SMTP...")
    exec_cmd(client, f"""cd /opt/inmova-app && cat >> .env.production << 'EOF'

# === GMAIL SMTP ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER={GMAIL_USER}
SMTP_PASSWORD={GMAIL_APP_PASSWORD}
SMTP_FROM={GMAIL_USER}
SMTP_FROM_NAME="Inmova App"
SMTP_SECURE=false
EOF
""")
    print("   ✅ SMTP configurado")
    print()
    
    print("[3/4] Reiniciando aplicación...")
    exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
    print("   ✅ PM2 reiniciado")
    time.sleep(15)
    print()
    
    print("[4/4] Verificando configuración...")
    result = exec_cmd(client, """cd /opt/inmova-app && node -e "
require('dotenv').config({ path: '.env.production' });
console.log('SMTP Host:', process.env.SMTP_HOST);
console.log('SMTP User:', process.env.SMTP_USER ? 'configurado' : 'falta');
console.log('SMTP Password:', process.env.SMTP_PASSWORD ? 'configurado' : 'falta');
" 2>&1""")
    print(result['output'])
    print()
    
    client.close()
    
    print()
    print("=" * 70)
    print("✅ GMAIL SMTP CONFIGURADO")
    print("=" * 70)
    print()
    print("📧 Configuración:")
    print(f"   SMTP: smtp.gmail.com:587")
    print(f"   From: {GMAIL_USER}")
    print()
    print("⚠️  LÍMITES DE GMAIL:")
    print("   • 500 emails/día (FREE)")
    print("   • 2000 emails/día (Google Workspace)")
    print()
    print("🧪 Test de email:")
    print("   Envía un email de prueba desde el dashboard")
    print()
    print("💡 RECOMENDACIÓN:")
    print("   Gmail SMTP es bueno para empezar, pero para producción")
    print("   considera SendGrid (más confiable y sin límites tan bajos)")
    print()
    
    return 0

if __name__ == '__main__':
    # Parse args si se pasan
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--email', help='Gmail address')
    parser.add_argument('--password', help='Gmail app password')
    args = parser.parse_args()
    
    if args.email:
        GMAIL_USER = args.email
    if args.password:
        GMAIL_APP_PASSWORD = args.password.replace('-', '')  # Remover guiones si los puso
    
    sys.exit(main())
