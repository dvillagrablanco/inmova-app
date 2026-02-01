#!/usr/bin/env python3
"""
Verificación final de todas las integraciones
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

# Todas las integraciones
INTEGRATIONS = {
    "🔐 Autenticación (NextAuth)": {
        "required": ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
        "optional": []
    },
    "💾 Base de Datos (PostgreSQL)": {
        "required": ["DATABASE_URL"],
        "optional": ["DIRECT_URL"]
    },
    "💳 Pagos (Stripe)": {
        "required": ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
        "optional": ["STRIPE_WEBHOOK_SECRET"]
    },
    "📧 Email (Gmail SMTP)": {
        "required": ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"],
        "optional": ["SMTP_PORT", "SMTP_FROM"]
    },
    "☁️ Storage (AWS S3)": {
        "required": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
        "optional": ["AWS_BUCKET", "AWS_BUCKET_NAME"]
    },
    "📊 Analytics (Google GA4)": {
        "required": ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
        "optional": []
    },
    "🔔 Push Notifications (VAPID)": {
        "required": ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
        "optional": []
    },
    "🤖 IA (Anthropic Claude)": {
        "required": ["ANTHROPIC_API_KEY"],
        "optional": []
    },
    "🗄️ Cache (Redis)": {
        "required": ["REDIS_URL"],
        "optional": []
    },
    "🔍 Monitoreo (Sentry)": {
        "required": ["SENTRY_DSN"],
        "optional": ["NEXT_PUBLIC_SENTRY_DSN"]
    },
    "📝 Firma Digital (DocuSign)": {
        "required": ["DOCUSIGN_INTEGRATION_KEY", "DOCUSIGN_USER_ID", "DOCUSIGN_ACCOUNT_ID"],
        "optional": ["DOCUSIGN_BASE_PATH", "DOCUSIGN_PRIVATE_KEY"]
    },
    "📱 SMS (Twilio)": {
        "required": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
        "optional": []
    },
    "✍️ Firma Digital (Signaturit)": {
        "required": ["SIGNATURIT_API_KEY"],
        "optional": []
    },
}

# Placeholders conocidos
PLACEHOLDERS = [
    "your_", "YOUR_", "xxx", "XXX", "placeholder", "PLACEHOLDER",
    "example", "EXAMPLE", "<TU_", "tu_", "cambiar", "https://...",
    "examplePublicKey", "o0.ingest.sentry.io/0"
]

def is_placeholder(value):
    """Verificar si un valor es un placeholder"""
    if not value:
        return True
    value_lower = value.lower()
    for ph in PLACEHOLDERS:
        if ph.lower() in value_lower:
            return True
    if len(value) < 10 and not value.startswith("G-"):
        return True
    return False

def exec_cmd(client, cmd, timeout=30):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status, output

def main():
    print("=" * 70)
    print("📊 VERIFICACIÓN FINAL DE INTEGRACIONES")
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
        # Leer .env.production
        status, env_content = exec_cmd(client, f"cat {APP_PATH}/.env.production")
        
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
        
        # Verificar cada integración
        results = {"complete": [], "partial": [], "missing": []}
        
        print("=" * 70)
        print("ESTADO DE CADA INTEGRACIÓN")
        print("=" * 70)
        
        for name, config in INTEGRATIONS.items():
            required = config["required"]
            optional = config.get("optional", [])
            
            # Contar requeridas encontradas
            found = sum(1 for v in required if v in env_vars)
            total = len(required)
            
            if found == total:
                status = "✅ COMPLETA"
                results["complete"].append(name)
            elif found > 0:
                status = f"⚠️ PARCIAL ({found}/{total})"
                results["partial"].append(name)
            else:
                status = "❌ FALTANTE"
                results["missing"].append(name)
            
            print(f"\n{name}: {status}")
            
            for v in required:
                if v in env_vars:
                    val = env_vars[v]
                    display = val[:25] + "..." if len(val) > 25 else val
                    print(f"  ✅ {v}={display}")
                else:
                    print(f"  ❌ {v}=FALTA")
            
            # Mostrar opcionales configuradas
            for v in optional:
                if v in env_vars:
                    val = env_vars[v]
                    display = val[:25] + "..." if len(val) > 25 else val
                    print(f"  ➕ {v}={display}")
        
        # Resumen
        total = len(INTEGRATIONS)
        complete = len(results["complete"])
        partial = len(results["partial"])
        missing = len(results["missing"])
        
        print("\n" + "=" * 70)
        print("📈 RESUMEN FINAL")
        print("=" * 70)
        
        print(f"\n✅ Completas: {complete}/{total}")
        for name in results["complete"]:
            print(f"   • {name}")
        
        if results["partial"]:
            print(f"\n⚠️ Parciales: {partial}/{total}")
            for name in results["partial"]:
                print(f"   • {name}")
        
        if results["missing"]:
            print(f"\n❌ Faltantes: {missing}/{total}")
            for name in results["missing"]:
                print(f"   • {name}")
        
        pct = (complete * 100) // total
        print(f"\n📊 Progreso Total: {pct}% ({complete}/{total} completas)")
        
        # Health check
        print("\n" + "=" * 70)
        print("🏥 HEALTH CHECK")
        print("=" * 70)
        
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        print(f"\n{output}")
        
        # Verificar PM2
        print("\n📦 PM2 Status:")
        status, output = exec_cmd(client, "pm2 status")
        print(output)
        
        return {
            "complete": complete,
            "partial": partial,
            "missing": missing,
            "total": total,
            "percentage": pct
        }
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
