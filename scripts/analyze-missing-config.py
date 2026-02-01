#!/usr/bin/env python3
"""
Analizar qué configuración podría faltar en Inmova
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import re

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd, timeout=60):
    """Ejecutar comando SSH"""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        return exit_status, output
    except Exception as e:
        return -1, str(e)

def main():
    print("=" * 70)
    print("🔍 ANÁLISIS DE CONFIGURACIÓN FALTANTE")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    issues = []
    recommendations = []
    
    try:
        # 1. Leer .env.production actual
        status, env_content = exec_cmd(client, f"cat {APP_PATH}/.env.production")
        env_vars = {}
        for line in env_content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                env_vars[key.strip()] = value.strip().strip('"').strip("'")
        
        # 2. Verificar variables que podrían estar referenciadas pero no configuradas
        print("=" * 70)
        print("1️⃣ VERIFICANDO VARIABLES REFERENCIADAS EN CÓDIGO")
        print("=" * 70)
        
        # Buscar todas las referencias a process.env
        status, output = exec_cmd(client, f"grep -roh 'process\\.env\\.[A-Z_]*' {APP_PATH}/lib {APP_PATH}/app --include='*.ts' --include='*.tsx' 2>/dev/null | sort | uniq")
        
        referenced_vars = set()
        for match in output.strip().split('\n'):
            var = match.replace('process.env.', '').strip()
            if var and len(var) > 2:
                referenced_vars.add(var)
        
        print(f"\nVariables referenciadas en código: {len(referenced_vars)}")
        print(f"Variables configuradas: {len(env_vars)}")
        
        # Variables faltantes
        missing_vars = []
        for var in referenced_vars:
            if var not in env_vars and var not in ['NODE_ENV', 'VERCEL', 'CI']:
                # Verificar si es una variable conocida
                status, count_output = exec_cmd(client, f"grep -c 'process.env.{var}' {APP_PATH}/lib {APP_PATH}/app --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v ':0' | wc -l")
                count = int(count_output.strip()) if count_output.strip().isdigit() else 0
                if count > 0:
                    missing_vars.append(var)
        
        if missing_vars:
            print(f"\n⚠️ Variables referenciadas pero NO configuradas ({len(missing_vars)}):")
            for var in sorted(missing_vars):
                print(f"  • {var}")
                issues.append(f"Variable {var} referenciada pero no configurada")
        else:
            print("\n✅ Todas las variables referenciadas están configuradas")
        
        # 3. Verificar archivos de configuración de Sentry
        print("\n" + "=" * 70)
        print("2️⃣ VERIFICANDO CONFIGURACIÓN DE SENTRY")
        print("=" * 70)
        
        sentry_files = [
            "sentry.client.config.ts",
            "sentry.server.config.ts",
            "sentry.edge.config.ts",
        ]
        
        for f in sentry_files:
            status, output = exec_cmd(client, f"cat {APP_PATH}/{f} 2>/dev/null | head -20")
            if output.strip():
                print(f"\n✅ {f} existe")
                if 'dsn' in output.lower():
                    print("  ✅ DSN configurado")
                else:
                    print("  ⚠️ DSN no encontrado en archivo")
                    issues.append(f"Sentry DSN no configurado en {f}")
            else:
                print(f"\n⚠️ {f} no existe")
                recommendations.append(f"Crear archivo {f} para capturar errores")
        
        # 4. Verificar webhooks configurados
        print("\n" + "=" * 70)
        print("3️⃣ VERIFICANDO ENDPOINTS DE WEBHOOKS")
        print("=" * 70)
        
        webhooks = {
            "stripe": "/api/webhooks/stripe",
            "docusign": "/api/webhooks/docusign",
            "signaturit": "/api/webhooks/signaturit",
            "twilio": "/api/webhooks/twilio",
        }
        
        for name, path in webhooks.items():
            route_path = f"{APP_PATH}/app{path}/route.ts"
            status, output = exec_cmd(client, f"ls -la {route_path} 2>/dev/null")
            if 'route.ts' in output:
                print(f"\n✅ Webhook {name} existe: {path}")
                # Verificar si tiene POST handler
                status, content = exec_cmd(client, f"grep -c 'export.*POST' {route_path}")
                if int(content.strip() or 0) > 0:
                    print("  ✅ Handler POST configurado")
                else:
                    print("  ⚠️ Handler POST no encontrado")
                    issues.append(f"Webhook {name} sin handler POST")
            else:
                print(f"\n⚠️ Webhook {name} no existe: {path}")
                if name in ['stripe', 'signaturit']:  # Los más importantes
                    recommendations.append(f"Crear webhook handler para {name}")
        
        # 5. Verificar configuración de next.config.js
        print("\n" + "=" * 70)
        print("4️⃣ VERIFICANDO next.config.js")
        print("=" * 70)
        
        status, output = exec_cmd(client, f"cat {APP_PATH}/next.config.js 2>/dev/null | head -50")
        if output:
            print("\n✅ next.config.js existe")
            
            # Verificar Sentry
            if 'sentry' in output.lower() or 'withSentryConfig' in output:
                print("  ✅ Sentry configurado en next.config.js")
            else:
                recommendations.append("Configurar Sentry en next.config.js")
            
            # Verificar headers de seguridad
            if 'headers' in output:
                print("  ✅ Headers de seguridad configurados")
            else:
                recommendations.append("Añadir headers de seguridad en next.config.js")
        
        # 6. Verificar NEXT_PUBLIC variables para cliente
        print("\n" + "=" * 70)
        print("5️⃣ VERIFICANDO VARIABLES PÚBLICAS (NEXT_PUBLIC_)")
        print("=" * 70)
        
        public_vars = {k: v for k, v in env_vars.items() if k.startswith('NEXT_PUBLIC_')}
        print(f"\nVariables NEXT_PUBLIC configuradas: {len(public_vars)}")
        for k, v in public_vars.items():
            display = v[:30] + "..." if len(v) > 30 else v
            print(f"  • {k}={display}")
        
        # Verificar si faltan algunas importantes
        important_public = [
            "NEXT_PUBLIC_APP_URL",
            "NEXT_PUBLIC_SENTRY_DSN",
        ]
        
        for var in important_public:
            if var not in env_vars:
                recommendations.append(f"Considerar añadir {var}")
        
        # 7. Verificar DocuSign private key (necesaria para JWT auth)
        print("\n" + "=" * 70)
        print("6️⃣ VERIFICANDO DOCUSIGN JWT AUTH")
        print("=" * 70)
        
        if 'DOCUSIGN_PRIVATE_KEY' not in env_vars:
            print("\n⚠️ DOCUSIGN_PRIVATE_KEY no configurada")
            print("   Necesaria para autenticación JWT (sin intervención manual)")
            issues.append("DocuSign Private Key no configurada - necesaria para JWT auth")
        else:
            print("\n✅ DOCUSIGN_PRIVATE_KEY configurada")
        
        # 8. Verificar variables opcionales pero útiles
        print("\n" + "=" * 70)
        print("7️⃣ VERIFICANDO VARIABLES OPCIONALES")
        print("=" * 70)
        
        optional_vars = {
            "OPENAI_API_KEY": "Para usar GPT como alternativa a Claude",
            "GOOGLE_CLIENT_ID": "Para login con Google OAuth",
            "GOOGLE_CLIENT_SECRET": "Para login con Google OAuth",
            "GITHUB_CLIENT_ID": "Para login con GitHub OAuth",
            "GITHUB_CLIENT_SECRET": "Para login con GitHub OAuth",
            "CRON_SECRET": "Para proteger endpoints de cron jobs",
            "REVALIDATE_SECRET": "Para revalidación on-demand de ISR",
            "RATE_LIMIT_BYPASS_KEY": "Para testing sin rate limiting",
        }
        
        for var, desc in optional_vars.items():
            if var in env_vars:
                print(f"  ✅ {var} configurada")
            else:
                print(f"  ⚪ {var} no configurada - {desc}")
        
        # 9. Verificar modo de producción
        print("\n" + "=" * 70)
        print("8️⃣ VERIFICANDO MODO DE PRODUCCIÓN")
        print("=" * 70)
        
        # Stripe
        if 'STRIPE_SECRET_KEY' in env_vars:
            if 'sk_test_' in env_vars['STRIPE_SECRET_KEY']:
                print("\n⚠️ Stripe está en modo TEST")
                recommendations.append("Cambiar Stripe a modo LIVE para producción real")
            elif 'sk_live_' in env_vars['STRIPE_SECRET_KEY']:
                print("\n✅ Stripe está en modo LIVE")
        
        # DocuSign
        if 'DOCUSIGN_BASE_PATH' in env_vars:
            if 'demo' in env_vars['DOCUSIGN_BASE_PATH']:
                print("\n⚠️ DocuSign está en modo DEMO")
                recommendations.append("Cambiar DocuSign a modo PRODUCTION cuando esté listo")
            else:
                print("\n✅ DocuSign está en modo PRODUCTION")
        
        # Resumen
        print("\n" + "=" * 70)
        print("📊 RESUMEN DEL ANÁLISIS")
        print("=" * 70)
        
        print(f"\n🔴 Problemas encontrados: {len(issues)}")
        for issue in issues:
            print(f"  • {issue}")
        
        print(f"\n🟡 Recomendaciones: {len(recommendations)}")
        for rec in recommendations:
            print(f"  • {rec}")
        
        if not issues and not recommendations:
            print("\n✅ No se encontraron problemas ni recomendaciones pendientes")
        
        return issues, recommendations
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
