#!/usr/bin/env python3
"""
Limpiar placeholders y verificar estado final de integraciones
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# Placeholders conocidos que deben eliminarse
PLACEHOLDER_VALUES = [
    "ACxxxxx",
    "your-token",
    "<TU_SENTRY_DSN>",
    "<TU_ACCOUNT_ID>",
    "-----BEGIN RSA",  # Sin completar
    "your_",
    "YOUR_",
    "placeholder",
    "PLACEHOLDER",
    "<TU_",
]

# Variables a limpiar si tienen placeholders
VARS_TO_CLEAN = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "SENTRY_DSN",
    "NEXT_PUBLIC_SENTRY_DSN",
    "DOCUSIGN_ACCOUNT_ID",
    "DOCUSIGN_PRIVATE_KEY",
    "DOCUSIGN_INTEGRATION_KEY",
    "DOCUSIGN_USER_ID",
    "SIGNATURIT_API_KEY",
]

def exec_cmd(client, cmd, timeout=30):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def is_placeholder(value):
    """Verificar si un valor es un placeholder"""
    if not value:
        return True
    for ph in PLACEHOLDER_VALUES:
        if ph in value:
            return True
    if len(value) < 10:
        return True
    return False

def main():
    print("=" * 70)
    print("🧹 LIMPIEZA DE PLACEHOLDERS Y VERIFICACIÓN FINAL")
    print("=" * 70)
    
    # Conectar
    print("\n🔐 Conectando...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    try:
        # 1. Leer .env.production actual
        print("📄 Leyendo .env.production...")
        status, env_content, _ = exec_cmd(client, f"cat {APP_PATH}/.env.production")
        
        lines = env_content.split('\n')
        cleaned_lines = []
        removed_vars = []
        
        for line in lines:
            line_stripped = line.strip()
            
            # Verificar si es una variable a limpiar
            should_remove = False
            for var in VARS_TO_CLEAN:
                if line_stripped.startswith(var + '='):
                    value = line_stripped.split('=', 1)[1].strip().strip('"').strip("'")
                    if is_placeholder(value):
                        should_remove = True
                        removed_vars.append(var)
                    break
            
            if not should_remove:
                cleaned_lines.append(line)
        
        if removed_vars:
            print(f"\n🧹 Eliminando {len(removed_vars)} placeholders:")
            for var in removed_vars:
                print(f"  • {var}")
            
            # Guardar archivo limpio
            new_content = '\n'.join(cleaned_lines)
            
            # Backup
            exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.final.$(date +%Y%m%d_%H%M%S)")
            
            # Escribir usando método seguro
            exec_cmd(client, f"cat > {APP_PATH}/.env.production << 'ENVEOF'\n{new_content}\nENVEOF")
            
            print("✅ Placeholders eliminados")
        else:
            print("✅ No hay placeholders que eliminar")
        
        # 2. Verificar estado actual
        print("\n" + "=" * 70)
        print("📊 ESTADO ACTUAL DE INTEGRACIONES")
        print("=" * 70)
        
        # Leer archivo actualizado
        status, env_content, _ = exec_cmd(client, f"cat {APP_PATH}/.env.production")
        
        # Parsear variables
        env_vars = {}
        for line in env_content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if value and not is_placeholder(value):
                    env_vars[key] = value
        
        # Definir integraciones
        integrations = {
            "✅ Autenticación (NextAuth)": ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
            "✅ Base de Datos": ["DATABASE_URL"],
            "💳 Stripe Pagos": ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
            "📧 Email SMTP": ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"],
            "☁️ AWS S3": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
            "📊 Google Analytics": ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
            "🔔 Push Notifications": ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
            "🤖 Anthropic AI": ["ANTHROPIC_API_KEY"],
            "🗄️ Redis": ["REDIS_URL"],
            "📱 Twilio SMS": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
            "🔍 Sentry": ["SENTRY_DSN"],
            "✍️ Signaturit": ["SIGNATURIT_API_KEY"],
            "📝 DocuSign": ["DOCUSIGN_INTEGRATION_KEY", "DOCUSIGN_USER_ID", "DOCUSIGN_ACCOUNT_ID"],
        }
        
        complete = 0
        partial = 0
        missing = 0
        
        for name, required_vars in integrations.items():
            found = sum(1 for v in required_vars if v in env_vars)
            total = len(required_vars)
            
            if found == total:
                print(f"\n✅ {name}: COMPLETA ({found}/{total})")
                complete += 1
                for v in required_vars:
                    val = env_vars.get(v, "")
                    display = val[:15] + "..." if len(val) > 15 else val
                    print(f"   • {v}={display}")
            elif found > 0:
                print(f"\n⚠️ {name}: PARCIAL ({found}/{total})")
                partial += 1
                for v in required_vars:
                    if v in env_vars:
                        val = env_vars[v]
                        display = val[:15] + "..." if len(val) > 15 else val
                        print(f"   ✅ {v}={display}")
                    else:
                        print(f"   ❌ {v}=FALTA")
            else:
                print(f"\n❌ {name}: FALTANTE ({found}/{total})")
                missing += 1
                for v in required_vars:
                    print(f"   ❌ {v}=FALTA")
        
        # Resumen
        total_integrations = len(integrations)
        print("\n" + "=" * 70)
        print("📈 RESUMEN FINAL")
        print("=" * 70)
        print(f"\n✅ Completas: {complete}/{total_integrations}")
        print(f"⚠️ Parciales: {partial}/{total_integrations}")
        print(f"❌ Faltantes: {missing}/{total_integrations}")
        print(f"\n📊 Progreso: {(complete*100)//total_integrations}%")
        
        # Mostrar qué credenciales específicas faltan
        print("\n" + "=" * 70)
        print("❓ CREDENCIALES QUE NECESITAS PROPORCIONAR")
        print("=" * 70)
        
        missing_creds = {
            "Twilio SMS (console.twilio.com)": [
                ("TWILIO_ACCOUNT_SID", "Account SID desde Dashboard"),
                ("TWILIO_AUTH_TOKEN", "Auth Token desde Dashboard"),
            ],
            "Sentry Monitoring (sentry.io)": [
                ("SENTRY_DSN", "DSN desde Settings > Projects > Client Keys"),
            ],
            "Signaturit Firma Digital (signaturit.com)": [
                ("SIGNATURIT_API_KEY", "API Key desde Dashboard > API"),
            ],
            "DocuSign Firma Digital (docusign.com)": [
                ("DOCUSIGN_INTEGRATION_KEY", "Integration Key desde Apps and Keys"),
                ("DOCUSIGN_USER_ID", "API Username (GUID)"),
                ("DOCUSIGN_ACCOUNT_ID", "Account ID desde Admin"),
            ],
        }
        
        for service, creds in missing_creds.items():
            missing_for_service = [(var, desc) for var, desc in creds if var not in env_vars]
            if missing_for_service:
                print(f"\n📌 {service}:")
                for var, desc in missing_for_service:
                    print(f"   • {var}: {desc}")
        
        # Health check
        print("\n" + "=" * 70)
        print("🏥 HEALTH CHECK")
        print("=" * 70)
        
        # Reiniciar PM2 para aplicar cambios
        print("\n🔄 Reiniciando PM2...")
        exec_cmd(client, "pm2 restart inmova-app --update-env")
        time.sleep(10)
        
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        print(f"\n{output}")
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
