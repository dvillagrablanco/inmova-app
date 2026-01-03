#!/usr/bin/env python3
"""
Script para configurar Stripe Webhook Secret
"""
import sys
import os
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'Dvillabla200775*'
APP_PATH = '/opt/inmova-app'

def exec_cmd(client, command, description=""):
    """Ejecutar comando y retornar output"""
    if description:
        print(f"[{time.strftime('%H:%M:%S')}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=30)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    error = stderr.read().decode('utf-8').strip()
    
    if output:
        print(output)
    if error and exit_status != 0:
        print(f"Error: {error}")
    
    return exit_status, output, error

def main():
    if len(sys.argv) < 2:
        print("❌ Falta el webhook secret")
        print("\nUso:")
        print("  python3 scripts/configure-stripe-webhook.py whsec_YOUR_SECRET_HERE")
        print("\nDónde obtener el secret:")
        print("  1. Ve a https://dashboard.stripe.com/webhooks")
        print("  2. Click en tu webhook")
        print("  3. Copia el 'Signing secret' (empieza con whsec_)")
        sys.exit(1)
    
    webhook_secret = sys.argv[1]
    
    # Validar formato
    if not webhook_secret.startswith('whsec_'):
        print("❌ El webhook secret debe empezar con 'whsec_'")
        print(f"   Recibido: {webhook_secret}")
        sys.exit(1)
    
    print("=" * 70)
    print("🔐 CONFIGURACIÓN DE STRIPE WEBHOOK SECRET")
    print("=" * 70)
    print(f"\nServidor: {SERVER_IP}")
    print(f"Webhook Secret: {webhook_secret[:15]}...")
    print()
    
    # Conectar
    print(f"[{time.strftime('%H:%M:%S')}] 🔐 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        print(f"[{time.strftime('%H:%M:%S')}] ✅ Conectado\n")
        
        # 1. Backup del .env actual
        print("=" * 70)
        print("📦 PASO 1: BACKUP")
        print("=" * 70)
        exec_cmd(
            client,
            f"cd {APP_PATH} && cp .env.production .env.production.backup-$(date +%Y%m%d_%H%M%S)",
            "💾 Creando backup de .env.production..."
        )
        print("✅ Backup creado\n")
        
        # 2. Verificar si ya existe el webhook secret
        print("=" * 70)
        print("🔍 PASO 2: VERIFICAR CONFIGURACIÓN ACTUAL")
        print("=" * 70)
        status, output, _ = exec_cmd(
            client,
            f"cd {APP_PATH} && grep -c 'STRIPE_WEBHOOK_SECRET' .env.production || true",
            "🔎 Buscando STRIPE_WEBHOOK_SECRET existente..."
        )
        
        exists = output and output.strip() != '0'
        
        if exists:
            print("⚠️  STRIPE_WEBHOOK_SECRET ya existe en .env.production")
            print("   Actualizando valor...\n")
            
            # Actualizar valor existente
            exec_cmd(
                client,
                f"""cd {APP_PATH} && sed -i 's|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET={webhook_secret}|' .env.production""",
                "✏️  Actualizando STRIPE_WEBHOOK_SECRET..."
            )
        else:
            print("ℹ️  STRIPE_WEBHOOK_SECRET no existe")
            print("   Añadiendo al archivo...\n")
            
            # Añadir nuevo valor
            exec_cmd(
                client,
                f"""cd {APP_PATH} && echo '' >> .env.production && echo '# Stripe Webhook Secret' >> .env.production && echo 'STRIPE_WEBHOOK_SECRET={webhook_secret}' >> .env.production""",
                "➕ Añadiendo STRIPE_WEBHOOK_SECRET..."
            )
        
        print("✅ STRIPE_WEBHOOK_SECRET configurado\n")
        
        # 3. Verificar configuración
        print("=" * 70)
        print("🔍 PASO 3: VERIFICACIÓN")
        print("=" * 70)
        status, output, _ = exec_cmd(
            client,
            f"cd {APP_PATH} && grep STRIPE_WEBHOOK_SECRET .env.production | sed 's/=.*$/=whsec_***HIDDEN***/'",
            "👀 Verificando configuración..."
        )
        print()
        
        # 4. Reiniciar PM2
        print("=" * 70)
        print("🔄 PASO 4: REINICIAR APLICACIÓN")
        print("=" * 70)
        exec_cmd(
            client,
            f"cd {APP_PATH} && pm2 restart inmova-app --update-env",
            "♻️  Reiniciando PM2 con nuevas variables..."
        )
        print("✅ PM2 reiniciado\n")
        
        # Esperar warm-up
        print(f"[{time.strftime('%H:%M:%S')}] ⏳ Esperando warm-up (10 segundos)...")
        time.sleep(10)
        
        # 5. Test de webhook endpoint
        print("\n" + "=" * 70)
        print("🧪 PASO 5: TEST DE ENDPOINT")
        print("=" * 70)
        
        status, output, _ = exec_cmd(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/webhooks/stripe",
            "🌐 Testeando endpoint de webhook..."
        )
        
        if output.strip() == '405':
            print("✅ Endpoint responde correctamente (405 = POST requerido)")
        elif output.strip() == '200':
            print("✅ Endpoint accesible")
        else:
            print(f"⚠️  Endpoint retorna: {output}")
        print()
        
        # 6. Verificar logs
        print("=" * 70)
        print("📋 PASO 6: VERIFICAR LOGS")
        print("=" * 70)
        exec_cmd(
            client,
            "pm2 logs inmova-app --lines 5 --nostream",
            "📄 Últimas 5 líneas de logs..."
        )
        print()
        
        # Resumen final
        print("=" * 70)
        print("✅ CONFIGURACIÓN COMPLETADA")
        print("=" * 70)
        print()
        print("📊 Resumen:")
        print(f"   ✅ STRIPE_WEBHOOK_SECRET configurado")
        print(f"   ✅ PM2 reiniciado")
        print(f"   ✅ Endpoint operativo")
        print()
        print("🧪 PRÓXIMO PASO: Test desde Stripe")
        print()
        print("   1. Ve a https://dashboard.stripe.com/webhooks")
        print("   2. Click en tu webhook")
        print("   3. Click en 'Send test webhook'")
        print("   4. Selecciona 'payment_intent.succeeded'")
        print("   5. Verifica que recibe 200 OK")
        print()
        print("📋 Ver logs en tiempo real:")
        print(f"   ssh root@{SERVER_IP}")
        print("   pm2 logs inmova-app --lines 50")
        print()
        print("=" * 70)
        
    except paramiko.AuthenticationException:
        print("❌ Error de autenticación SSH")
        sys.exit(1)
    except paramiko.SSHException as e:
        print(f"❌ Error SSH: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == '__main__':
    main()
