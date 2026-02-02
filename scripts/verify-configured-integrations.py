#!/usr/bin/env python3
"""
Verificar las integraciones que el usuario configuró manualmente
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

# Integraciones a verificar (las que estaban pendientes)
INTEGRATIONS_TO_CHECK = {
    "Twilio SMS": {
        "required": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
        "optional": ["TWILIO_MESSAGING_SERVICE_SID"]
    },
    "Sentry Monitoring": {
        "required": ["SENTRY_DSN"],
        "optional": ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"]
    },
    "Signaturit Firma Digital": {
        "required": ["SIGNATURIT_API_KEY"],
        "optional": ["SIGNATURIT_ENVIRONMENT", "SIGNATURIT_WEBHOOK_SECRET"]
    },
    "DocuSign Firma Digital": {
        "required": ["DOCUSIGN_INTEGRATION_KEY", "DOCUSIGN_USER_ID", "DOCUSIGN_ACCOUNT_ID"],
        "optional": ["DOCUSIGN_PRIVATE_KEY", "DOCUSIGN_AUTH_SERVER"]
    }
}

# Todas las integraciones para reporte completo
ALL_INTEGRATIONS = {
    "Autenticación (NextAuth)": {
        "required": ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
        "optional": []
    },
    "Base de Datos (PostgreSQL)": {
        "required": ["DATABASE_URL"],
        "optional": ["DIRECT_URL"]
    },
    "Stripe Pagos": {
        "required": ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
        "optional": ["STRIPE_WEBHOOK_SECRET"]
    },
    "Email SMTP (Gmail)": {
        "required": ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"],
        "optional": ["SMTP_PORT", "SMTP_FROM"]
    },
    "AWS S3 Storage": {
        "required": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
        "optional": ["AWS_BUCKET", "AWS_BUCKET_NAME"]
    },
    "Google Analytics": {
        "required": ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
        "optional": []
    },
    "Push Notifications (VAPID)": {
        "required": ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
        "optional": []
    },
    "Anthropic AI": {
        "required": ["ANTHROPIC_API_KEY"],
        "optional": []
    },
    "Redis Cache": {
        "required": ["REDIS_URL"],
        "optional": ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]
    },
    **INTEGRATIONS_TO_CHECK
}

# Placeholders conocidos a ignorar
PLACEHOLDERS = [
    "your_", "YOUR_", "your", "YOUR", "xxx", "XXX", "placeholder", "PLACEHOLDER",
    "example", "EXAMPLE", "test_key", "TEST_KEY", "<", ">",
    "tu_", "TU_", "cambiar", "CAMBIAR", "aqui", "AQUI"
]

def is_placeholder(value, key=None):
    """Verificar si un valor es un placeholder"""
    if not value:
        return True
    value_lower = value.lower()
    for ph in PLACEHOLDERS:
        if ph.lower() in value_lower:
            return True
    # Permitir valores cortos conocidos
    if key in {"AWS_REGION"}:
        return False
    # También verificar si es muy corto (probablemente inválido)
    if len(value) < 10 and not value.startswith("G-"):  # GA IDs son cortos
        return True
    return False

def exec_cmd(client, cmd, timeout=30):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print("=" * 70)
    print("🔍 VERIFICACIÓN DE INTEGRACIONES CONFIGURADAS")
    print("=" * 70)
    print(f"\nServidor: {SERVER_IP}")
    print(f"Path: {APP_PATH}")
    print()
    
    # Conectar al servidor
    print("🔐 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10
        )
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return
    
    try:
        # Leer .env.production actual
        print("📄 Leyendo .env.production...")
        status, env_content, _ = exec_cmd(client, f"cat {APP_PATH}/.env.production 2>/dev/null")
        
        if status != 0 or not env_content:
            print("⚠️ No se pudo leer .env.production, intentando .env.local...")
            status, env_content, _ = exec_cmd(client, f"cat {APP_PATH}/.env.local 2>/dev/null")
        
        # Parsear variables de entorno
        env_vars = {}
        for line in env_content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                env_vars[key] = value
        
        print(f"✅ {len(env_vars)} variables encontradas\n")
        
        # También verificar PM2 env
        print("📄 Verificando variables en PM2...")
        status, pm2_env, _ = exec_cmd(client, "pm2 env 0 2>/dev/null | head -100")
        
        pm2_vars = {}
        for line in pm2_env.split('\n'):
            line = line.strip()
            if ':' in line:
                key, _, value = line.partition(':')
                key = key.strip()
                value = value.strip()
                if key and value and not key.startswith('PM2'):
                    pm2_vars[key] = value
        
        # Combinar variables (prioridad: env_vars, luego pm2_vars)
        all_vars = {**pm2_vars, **env_vars}
        
        print(f"✅ {len(pm2_vars)} variables adicionales en PM2\n")
        
        # Verificar cada integración
        print("=" * 70)
        print("📊 ESTADO DE INTEGRACIONES")
        print("=" * 70)
        
        results = {
            "complete": [],
            "partial": [],
            "missing": []
        }
        
        for integration_name, config in ALL_INTEGRATIONS.items():
            required = config["required"]
            optional = config.get("optional", [])
            
            # Verificar variables requeridas
            required_found = 0
            required_valid = 0
            required_details = []
            
            for var in required:
                value = all_vars.get(var, "")
                if value:
                    required_found += 1
                    if not is_placeholder(value, var):
                        required_valid += 1
                        # Mostrar parcialmente el valor
                        if len(value) > 20:
                            display = value[:8] + "..." + value[-4:]
                        else:
                            display = value[:4] + "..."
                        required_details.append(f"  ✅ {var}={display}")
                    else:
                        required_details.append(f"  ⚠️ {var}=PLACEHOLDER")
                else:
                    required_details.append(f"  ❌ {var}=NO ENCONTRADO")
            
            # Verificar variables opcionales
            optional_details = []
            for var in optional:
                value = all_vars.get(var, "")
                if value and not is_placeholder(value, var):
                    if len(value) > 20:
                        display = value[:8] + "..." + value[-4:]
                    else:
                        display = value[:4] + "..."
                    optional_details.append(f"  ✅ {var}={display}")
            
            # Determinar estado
            if required_valid == len(required):
                status_icon = "✅"
                status_text = "COMPLETA"
                results["complete"].append(integration_name)
            elif required_valid > 0:
                status_icon = "⚠️"
                status_text = f"PARCIAL ({required_valid}/{len(required)})"
                results["partial"].append(integration_name)
            else:
                status_icon = "❌"
                status_text = "FALTANTE"
                results["missing"].append(integration_name)
            
            print(f"\n{status_icon} {integration_name}: {status_text}")
            for detail in required_details:
                print(detail)
            for detail in optional_details:
                print(detail)
        
        # Resumen final
        print("\n" + "=" * 70)
        print("📈 RESUMEN FINAL")
        print("=" * 70)
        
        total = len(ALL_INTEGRATIONS)
        complete = len(results["complete"])
        partial = len(results["partial"])
        missing = len(results["missing"])
        
        print(f"\n✅ Completas: {complete}/{total} ({complete*100//total}%)")
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
        
        # Verificar integraciones específicas que el usuario dijo que configuró
        print("\n" + "=" * 70)
        print("🔍 INTEGRACIONES PENDIENTES (las que configuraste)")
        print("=" * 70)
        
        for name in INTEGRATIONS_TO_CHECK.keys():
            if name in results["complete"]:
                print(f"\n✅ {name}: CONFIGURADA CORRECTAMENTE")
            elif name in results["partial"]:
                print(f"\n⚠️ {name}: PARCIALMENTE CONFIGURADA")
                config = INTEGRATIONS_TO_CHECK[name]
                for var in config["required"]:
                    value = all_vars.get(var, "")
                    if not value or is_placeholder(value):
                        print(f"   ❌ Falta: {var}")
            else:
                print(f"\n❌ {name}: NO CONFIGURADA")
                config = INTEGRATIONS_TO_CHECK[name]
                for var in config["required"]:
                    print(f"   ❌ Falta: {var}")
        
        # Health check
        print("\n" + "=" * 70)
        print("🏥 HEALTH CHECK")
        print("=" * 70)
        
        status, output, _ = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        print(f"\n{output}")
        
        return results
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
