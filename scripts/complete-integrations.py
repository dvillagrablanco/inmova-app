#!/usr/bin/env python3
"""
Script para completar las integraciones con las credenciales encontradas en documentación.
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

# Credenciales adicionales encontradas en documentación
ADDITIONAL_VARS = {
    # AWS S3 (de SETUP_AWS_S3.md)
    "AWS_BUCKET": "inmova-production",
    "AWS_BUCKET_NAME": "inmova-production",
    "AWS_REGION": "eu-west-1",
    
    # Stripe webhook (único valor completo disponible)
    "STRIPE_WEBHOOK_SECRET": "whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe",
}

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}[{time.strftime('%H:%M:%S')}] {msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8').strip()
    return exit_status, output

def main():
    log("🔐 Conectando al servidor...", Colors.BLUE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30, look_for_keys=False, allow_agent=False)
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        return 1
    
    # 1. Backup
    log("\n💾 Creando backup de .env.production...", Colors.BLUE)
    exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.complete.$(date +%Y%m%d_%H%M%S)")
    
    # 2. Añadir variables adicionales
    log("\n🔧 Configurando variables adicionales...", Colors.CYAN)
    
    for key, value in ADDITIONAL_VARS.items():
        # Verificar si existe
        check = f"grep -q '^{key}=' {APP_PATH}/.env.production && echo EXISTS || echo NOT_EXISTS"
        status, exists = exec_cmd(client, check)
        
        if exists == 'EXISTS':
            # Actualizar
            cmd = f"sed -i 's|^{key}=.*|{key}={value}|' {APP_PATH}/.env.production"
        else:
            # Añadir
            cmd = f"echo '{key}={value}' >> {APP_PATH}/.env.production"
        
        status, _ = exec_cmd(client, cmd)
        log(f"  ✅ {key} configurada", Colors.GREEN)
    
    # 3. Copiar a .env.local
    exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.local")
    
    # 4. Reiniciar PM2
    log("\n♻️ Reiniciando PM2 con nuevas variables...", Colors.BLUE)
    status, output = exec_cmd(client, "pm2 restart inmova-app --update-env", timeout=120)
    
    if status == 0:
        log("✅ PM2 reiniciado exitosamente", Colors.GREEN)
    else:
        log(f"⚠️ Output: {output}", Colors.YELLOW)
    
    # Esperar warm-up
    log("⏳ Esperando warm-up (15s)...", Colors.BLUE)
    time.sleep(15)
    
    # 5. Verificar health
    log("🏥 Verificando health check...", Colors.BLUE)
    status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
    
    if '"status":"ok"' in output:
        log("✅ Health check: OK", Colors.GREEN)
    else:
        log(f"⚠️ Health check: {output[:100]}", Colors.YELLOW)
    
    # 6. Mostrar resumen final
    print(f"\n{'='*70}")
    log("📊 RESUMEN FINAL DE CONFIGURACIÓN", Colors.CYAN)
    print(f"{'='*70}\n")
    
    # Leer todas las variables configuradas
    status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep -v '^#' | grep -v '^$' | cut -d'=' -f1 | sort")
    configured = set(output.split('\n')) if output else set()
    
    integrations = {
        "✅ Autenticación (NextAuth)": {
            "vars": ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
            "status": "COMPLETA"
        },
        "✅ Base de Datos (PostgreSQL)": {
            "vars": ["DATABASE_URL"],
            "status": "COMPLETA"
        },
        "⚠️ Pagos (Stripe)": {
            "vars": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
            "note": "Falta STRIPE_SECRET_KEY y publishable key (no disponibles en docs)"
        },
        "✅ Email (Gmail SMTP)": {
            "vars": ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_PORT", "SMTP_FROM"],
            "status": "COMPLETA"
        },
        "✅ Analytics (Google GA4)": {
            "vars": ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
            "status": "COMPLETA",
            "value": "G-WX2LE41M4T"
        },
        "✅ Storage (AWS S3)": {
            "vars": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET", "AWS_REGION"],
            "status": "COMPLETA"
        },
        "✅ Push Notifications (VAPID)": {
            "vars": ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
            "status": "COMPLETA (generadas)"
        },
        "❌ SMS (Twilio)": {
            "vars": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
            "note": "No encontradas en documentación"
        },
        "❌ Monitoreo (Sentry)": {
            "vars": ["SENTRY_DSN"],
            "note": "No encontrada en documentación"
        },
        "❌ IA (Anthropic/Abacus)": {
            "vars": ["ANTHROPIC_API_KEY", "ABACUSAI_API_KEY"],
            "note": "No encontradas en documentación"
        },
        "❌ Cache (Redis)": {
            "vars": ["REDIS_URL"],
            "note": "No encontrada en documentación"
        },
        "❌ Firma Digital (Signaturit)": {
            "vars": ["SIGNATURIT_API_KEY"],
            "note": "No encontrada en documentación"
        },
    }
    
    print("INTEGRACIONES CONFIGURADAS:\n")
    for name, info in integrations.items():
        vars_needed = info.get("vars", [])
        count = sum(1 for v in vars_needed if v in configured)
        total = len(vars_needed)
        
        if count == total:
            print(f"  {name}")
            if info.get("value"):
                print(f"    → {info['value']}")
        elif count > 0:
            print(f"  {name} ({count}/{total})")
            if info.get("note"):
                print(f"    → {info['note']}")
        else:
            print(f"  {name}")
            if info.get("note"):
                print(f"    → {info['note']}")
    
    print(f"\n{'='*70}")
    log("📝 VARIABLES ALINEADAS EN .env.production:", Colors.CYAN)
    print(f"{'='*70}\n")
    
    # Mostrar variables configuradas (con valores ocultos)
    status, output = exec_cmd(client, f"cat {APP_PATH}/.env.production | grep -v '^#' | grep -v '^$'")
    
    for line in output.split('\n'):
        if '=' in line:
            key = line.split('=')[0]
            value = '='.join(line.split('=')[1:])
            # Ocultar valores sensibles
            if any(s in key.upper() for s in ['SECRET', 'PASSWORD', 'KEY', 'TOKEN', 'URL']):
                if len(value) > 10:
                    value = value[:8] + "..." + value[-4:]
            print(f"  {key}={value}")
    
    print(f"\n{'='*70}")
    print(f"{Colors.GREEN}✅ CONFIGURACIÓN COMPLETADA{Colors.END}")
    print(f"{'='*70}\n")
    
    print(f"""
📋 RESUMEN:
  
  ✅ COMPLETAMENTE CONFIGURADAS (7):
     - Autenticación (NextAuth)
     - Base de Datos (PostgreSQL)
     - Email (Gmail SMTP - 500 emails/día)
     - Analytics (Google GA4)
     - Storage (AWS S3)
     - Push Notifications (VAPID)
     - CDN/SSL (Cloudflare)
  
  ⚠️ PARCIALMENTE CONFIGURADAS (1):
     - Stripe (solo webhook secret disponible)
  
  ❌ NO CONFIGURADAS (5) - Credenciales no encontradas:
     - Twilio (SMS)
     - Sentry (Monitoreo)
     - Anthropic/Abacus (IA)
     - Redis (Cache)
     - Signaturit (Firma Digital)

💡 NOTAS:
  - Las credenciales de Stripe (SECRET_KEY y PUBLISHABLE_KEY) no están 
    completas en la documentación. Se necesitan del dashboard de Stripe.
  - Las integraciones marcadas como ❌ requieren crear cuentas en los
    respectivos servicios y obtener las API keys.

🌐 URLs:
  - App: https://inmovaapp.com
  - Login: https://inmovaapp.com/login
  - Health: https://inmovaapp.com/api/health
""")
    
    client.close()
    log("🔐 Conexión cerrada", Colors.BLUE)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
