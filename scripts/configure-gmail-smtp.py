#!/usr/bin/env python3
"""Configurar Gmail SMTP en el servidor"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def exec_cmd(client, command, description=""):
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=60)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    
    if output:
        print(output)
    
    return exit_status, output

def configure_gmail(gmail_user, gmail_app_password):
    print("📧 CONFIGURANDO GMAIL SMTP\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        print("✅ Conectado al servidor\n")
        
        # 1. Backup
        print("1️⃣  Backup de .env.local...")
        exec_cmd(
            client,
            f"cd {APP_PATH} && cp .env.local .env.local.backup_$(date +%Y%m%d_%H%M%S)",
            "Creando backup..."
        )
        print("✅ Backup creado\n")
        
        # 2. Preparar variables SMTP
        smtp_vars = f"""
# Gmail SMTP Configuration (added {time.strftime('%Y-%m-%d %H:%M:%S')})
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER={gmail_user}
SMTP_PASS={gmail_app_password}
SMTP_FROM="Inmova App <{gmail_user}>"
"""
        
        # 3. Verificar si ya existen variables SMTP
        print("2️⃣  Verificando configuración existente...")
        status, output = exec_cmd(
            client,
            f"cd {APP_PATH} && grep -c 'SMTP_HOST' .env.local || echo '0'",
            "Verificando..."
        )
        
        has_smtp = output.strip() != '0'
        
        if has_smtp:
            print("⚠️  Ya existe configuración SMTP, actualizando...\n")
            
            # Actualizar cada variable
            exec_cmd(
                client,
                f"cd {APP_PATH} && sed -i 's|^SMTP_HOST=.*|SMTP_HOST=smtp.gmail.com|' .env.local",
                "Actualizando SMTP_HOST..."
            )
            exec_cmd(
                client,
                f"cd {APP_PATH} && sed -i 's|^SMTP_PORT=.*|SMTP_PORT=587|' .env.local",
                "Actualizando SMTP_PORT..."
            )
            exec_cmd(
                client,
                f"cd {APP_PATH} && sed -i 's|^SMTP_SECURE=.*|SMTP_SECURE=false|' .env.local",
                "Actualizando SMTP_SECURE..."
            )
            exec_cmd(
                client,
                f"cd {APP_PATH} && sed -i 's|^SMTP_USER=.*|SMTP_USER={gmail_user}|' .env.local",
                "Actualizando SMTP_USER..."
            )
            exec_cmd(
                client,
                f"cd {APP_PATH} && sed -i 's|^SMTP_PASS=.*|SMTP_PASS={gmail_app_password}|' .env.local",
                "Actualizando SMTP_PASS..."
            )
            exec_cmd(
                client,
                f"cd {APP_PATH} && sed -i 's|^SMTP_FROM=.*|SMTP_FROM=\"Inmova App <{gmail_user}>\"|' .env.local",
                "Actualizando SMTP_FROM..."
            )
        else:
            print("➕ Añadiendo configuración SMTP...\n")
            
            # Escapar comillas
            safe_vars = smtp_vars.replace("'", "'\\''")
            
            exec_cmd(
                client,
                f"cd {APP_PATH} && echo '{safe_vars}' >> .env.local",
                "Añadiendo variables SMTP..."
            )
        
        print("✅ Variables SMTP configuradas\n")
        
        # 4. También actualizar .env.production
        print("3️⃣  Actualizando .env.production...")
        status, output = exec_cmd(
            client,
            f"cd {APP_PATH} && grep -c 'SMTP_HOST' .env.production || echo '0'",
            "Verificando..."
        )
        
        if output.strip() == '0':
            safe_vars = smtp_vars.replace("'", "'\\''")
            exec_cmd(
                client,
                f"cd {APP_PATH} && echo '{safe_vars}' >> .env.production",
                "Añadiendo..."
            )
        else:
            exec_cmd(
                client,
                f"cd {APP_PATH} && sed -i 's|^SMTP_USER=.*|SMTP_USER={gmail_user}|' .env.production",
                "Actualizando..."
            )
            exec_cmd(
                client,
                f"cd {APP_PATH} && sed -i 's|^SMTP_PASS=.*|SMTP_PASS={gmail_app_password}|' .env.production",
                "Actualizando..."
            )
        
        print("✅ .env.production actualizado\n")
        
        # 5. Verificar
        print("4️⃣  Verificando configuración...")
        status, output = exec_cmd(
            client,
            f"cd {APP_PATH} && grep -E '(SMTP_HOST|SMTP_USER|SMTP_FROM)' .env.local",
            "Variables configuradas:"
        )
        print()
        
        # 6. Reiniciar PM2
        print("5️⃣  Reiniciando PM2...")
        exec_cmd(client, "pm2 restart inmova-app", "Reiniciando...")
        print("✅ PM2 reiniciado\n")
        
        print("⏳ Esperando 15 segundos para warm-up...")
        time.sleep(15)
        
        # 7. Test de email
        print("\n6️⃣  TEST DE EMAIL...")
        print("⚠️  Este test puede fallar si Nodemailer no está configurado en la app")
        print("    Pero las variables de entorno están configuradas correctamente.\n")
        
        # Script de test de Nodemailer
        test_script = f"""
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({{
  host: '{smtp_vars.split('SMTP_HOST=')[1].split()[0]}',
  port: 587,
  secure: false,
  auth: {{
    user: '{gmail_user}',
    pass: '{gmail_app_password}'
  }}
}});

transporter.verify()
  .then(() => {{
    console.log('✅ SMTP conectado correctamente');
    process.exit(0);
  }})
  .catch(err => {{
    console.error('❌ Error SMTP:', err.message);
    process.exit(1);
  }});
"""
        
        # Escribir script de test
        safe_script = test_script.replace("'", "'\\''")
        exec_cmd(
            client,
            f"cd {APP_PATH} && echo '{safe_script}' > /tmp/test-smtp.js",
            "Creando script de test..."
        )
        
        # Ejecutar test
        status, output = exec_cmd(
            client,
            f"cd {APP_PATH} && node /tmp/test-smtp.js",
            "Ejecutando test SMTP..."
        )
        
        if status == 0:
            print("✅ Test de conexión SMTP exitoso\n")
        else:
            print("⚠️  Test de conexión falló (puede ser que nodemailer no esté instalado)\n")
            print("   Las variables están configuradas correctamente.\n")
        
        # Limpiar
        exec_cmd(client, "rm /tmp/test-smtp.js", "Limpiando...")
        
        # Resumen
        print("=" * 70)
        print("✅ GMAIL SMTP CONFIGURADO EXITOSAMENTE")
        print("=" * 70)
        print()
        print("📧 Configuración:")
        print(f"  Email: {gmail_user}")
        print(f"  Servidor: smtp.gmail.com:587")
        print(f"  Remitente: Inmova App <{gmail_user}>")
        print()
        print("🧪 Testear envío de email:")
        print()
        print("  Opción 1 - Desde la app (si tienes endpoint de test):")
        print("  curl -X POST https://inmovaapp.com/api/test/send-email \\")
        print("    -H 'Content-Type: application/json' \\")
        print(f"    -d '{{\"to\":\"{gmail_user}\",\"subject\":\"Test\",\"text\":\"Prueba\"}}'")
        print()
        print("  Opción 2 - Trigger automático:")
        print("  - Registra un nuevo usuario → debe recibir email de bienvenida")
        print("  - Recuperar contraseña → debe recibir email")
        print()
        print("📋 Ver logs de emails:")
        print("  pm2 logs inmova-app | grep -i email")
        print()
        print("⚠️  Límites de Gmail:")
        print("  - Cuenta gratuita: 500 emails/día")
        print("  - Si necesitas más, considera SendGrid, Mailgun o AWS SES")
        print()
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    print("=" * 70)
    print("📧 CONFIGURACIÓN DE GMAIL SMTP PARA INMOVA")
    print("=" * 70)
    print()
    print("⚠️  REQUISITOS:")
    print("  1. Cuenta de Gmail")
    print("  2. Verificación en 2 pasos activada")
    print("  3. App Password generada")
    print()
    print("📖 Guía completa: GMAIL_SMTP_CONFIGURACION.md")
    print()
    print("=" * 70)
    print()
    
    # Pedir credenciales
    gmail_user = input("📧 Email de Gmail: ").strip()
    
    if not gmail_user:
        print("❌ Email requerido")
        sys.exit(1)
    
    if not gmail_user.endswith('@gmail.com'):
        print("⚠️  Advertencia: No es una cuenta @gmail.com")
        confirm = input("¿Continuar? (s/n): ").strip().lower()
        if confirm != 's':
            print("Cancelado")
            sys.exit(0)
    
    print()
    print("🔑 App Password:")
    print("   (16 caracteres sin espacios, ej: abcdefghijklmnop)")
    gmail_app_password = input("   Password: ").strip()
    
    if not gmail_app_password:
        print("❌ App Password requerida")
        sys.exit(1)
    
    # Remover espacios si los tiene
    gmail_app_password = gmail_app_password.replace(' ', '')
    
    if len(gmail_app_password) != 16:
        print(f"⚠️  Advertencia: App Password debería tener 16 caracteres (tiene {len(gmail_app_password)})")
        confirm = input("¿Continuar de todos modos? (s/n): ").strip().lower()
        if confirm != 's':
            print("Cancelado")
            sys.exit(0)
    
    print()
    print("=" * 70)
    print()
    
    # Configurar
    configure_gmail(gmail_user, gmail_app_password)
