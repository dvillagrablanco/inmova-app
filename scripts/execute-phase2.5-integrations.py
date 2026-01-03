#!/usr/bin/env python3
"""
FASE 2.5: CONFIGURACIÓN DE INTEGRACIONES (AWS + STRIPE)
Configura credenciales de producción para AWS S3 y Stripe
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

class Phase25Integrations:
    def __init__(self):
        self.client = None
        self.logs = []
        
    def log(self, msg):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_msg = f"[{timestamp}] {msg}"
        print(log_msg)
        self.logs.append(log_msg)
    
    def connect(self):
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(
                hostname=SERVER_CONFIG['host'],
                username=SERVER_CONFIG['username'],
                password=SERVER_CONFIG['password'],
                port=SERVER_CONFIG['port'],
                timeout=SERVER_CONFIG['timeout']
            )
            self.log("✅ Conectado al servidor")
            return True
        except Exception as e:
            self.log(f"❌ Error conectando: {e}")
            return False
    
    def exec_cmd(self, cmd, timeout=60):
        try:
            stdin, stdout, stderr = self.client.exec_command(cmd, timeout=timeout)
            exit_status = stdout.channel.recv_exit_status()
            output = stdout.read().decode('utf-8', errors='ignore')
            error = stderr.read().decode('utf-8', errors='ignore')
            return {'exit': exit_status, 'output': output, 'error': error}
        except Exception as e:
            self.log(f"❌ Error: {e}")
            return None
    
    def backup_env(self):
        self.log("💾 Backup de .env.production...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.exec_cmd(f"cp /opt/inmova-app/.env.production /opt/inmova-app/.env.production.backup_{timestamp}")
        self.log("✅ Backup creado")
    
    def read_current_env(self):
        self.log("📖 Leyendo .env.production actual...")
        result = self.exec_cmd("cat /opt/inmova-app/.env.production")
        if result and result['exit'] == 0:
            return result['output']
        return None
    
    def get_credentials_from_user(self):
        self.log("\n" + "=" * 70)
        self.log("🔑 CONFIGURACIÓN DE CREDENCIALES")
        self.log("=" * 70)
        self.log("")
        self.log("Necesito las credenciales de producción.")
        self.log("Si no las tienes ahora, puedes:")
        self.log("  1. Usar placeholders (configurar después)")
        self.log("  2. Proporcionar las reales ahora")
        self.log("")
        
        print("\n" + "=" * 70)
        print("CREDENCIALES REQUERIDAS")
        print("=" * 70)
        
        credentials = {}
        
        # AWS
        print("\n--- AWS S3 ---")
        print("¿Tienes credenciales de AWS? (s/n): ", end='')
        has_aws = input().strip().lower()
        
        if has_aws == 's':
            print("AWS_ACCESS_KEY_ID: ", end='')
            credentials['AWS_ACCESS_KEY_ID'] = input().strip()
            
            print("AWS_SECRET_ACCESS_KEY: ", end='')
            credentials['AWS_SECRET_ACCESS_KEY'] = input().strip()
            
            print("AWS_REGION (default: eu-west-1): ", end='')
            region = input().strip()
            credentials['AWS_REGION'] = region if region else 'eu-west-1'
            
            print("AWS_BUCKET (nombre del bucket): ", end='')
            credentials['AWS_BUCKET'] = input().strip()
        else:
            credentials['AWS_ACCESS_KEY_ID'] = 'your-aws-access-key-id'
            credentials['AWS_SECRET_ACCESS_KEY'] = 'your-aws-secret-access-key'
            credentials['AWS_REGION'] = 'eu-west-1'
            credentials['AWS_BUCKET'] = 'inmova-uploads-prod'
            print("⚠️  Usando placeholders para AWS")
        
        # Stripe
        print("\n--- Stripe ---")
        print("¿Tienes credenciales de Stripe? (s/n): ", end='')
        has_stripe = input().strip().lower()
        
        if has_stripe == 's':
            print("STRIPE_SECRET_KEY (sk_live_...): ", end='')
            credentials['STRIPE_SECRET_KEY'] = input().strip()
            
            print("STRIPE_PUBLIC_KEY (pk_live_...): ", end='')
            credentials['STRIPE_PUBLIC_KEY'] = input().strip()
            
            print("STRIPE_WEBHOOK_SECRET (whsec_...) [opcional]: ", end='')
            webhook = input().strip()
            if webhook:
                credentials['STRIPE_WEBHOOK_SECRET'] = webhook
        else:
            credentials['STRIPE_SECRET_KEY'] = 'sk_test_placeholder'
            credentials['STRIPE_PUBLIC_KEY'] = 'pk_test_placeholder'
            print("⚠️  Usando placeholders para Stripe")
        
        # Otros servicios opcionales
        print("\n--- Servicios Opcionales ---")
        print("¿Configurar Twilio? (s/n): ", end='')
        has_twilio = input().strip().lower()
        
        if has_twilio == 's':
            print("TWILIO_ACCOUNT_SID: ", end='')
            credentials['TWILIO_ACCOUNT_SID'] = input().strip()
            
            print("TWILIO_AUTH_TOKEN: ", end='')
            credentials['TWILIO_AUTH_TOKEN'] = input().strip()
            
            print("TWILIO_PHONE_NUMBER (+34...): ", end='')
            credentials['TWILIO_PHONE_NUMBER'] = input().strip()
        
        print("¿Configurar SendGrid? (s/n): ", end='')
        has_sendgrid = input().strip().lower()
        
        if has_sendgrid == 's':
            print("SENDGRID_API_KEY: ", end='')
            credentials['SENDGRID_API_KEY'] = input().strip()
        
        print("¿Configurar Sentry DSN? (s/n): ", end='')
        has_sentry = input().strip().lower()
        
        if has_sentry == 's':
            print("SENTRY_DSN: ", end='')
            credentials['SENTRY_DSN'] = input().strip()
        
        return credentials
    
    def update_env_file(self, current_env, credentials):
        self.log("\n🔧 Actualizando .env.production...")
        
        # Leer líneas actuales
        lines = current_env.split('\n')
        updated_lines = []
        added_keys = set()
        
        # Actualizar líneas existentes
        for line in lines:
            if '=' in line and not line.strip().startswith('#'):
                key = line.split('=')[0].strip()
                if key in credentials:
                    updated_lines.append(f"{key}={credentials[key]}")
                    added_keys.add(key)
                    self.log(f"   ✅ Actualizado: {key}")
                else:
                    updated_lines.append(line)
            else:
                updated_lines.append(line)
        
        # Añadir nuevas claves
        for key, value in credentials.items():
            if key not in added_keys:
                updated_lines.append(f"{key}={value}")
                self.log(f"   ✅ Añadido: {key}")
        
        new_env = '\n'.join(updated_lines)
        
        # Escribir en servidor
        try:
            # Escapar comillas para bash
            escaped_env = new_env.replace("'", "'\\''")
            
            sftp = self.client.open_sftp()
            with sftp.file('/opt/inmova-app/.env.production', 'w') as f:
                f.write(new_env)
            sftp.close()
            
            self.log("✅ .env.production actualizado")
            return True
        except Exception as e:
            self.log(f"❌ Error escribiendo .env: {e}")
            return False
    
    def verify_env_variables(self):
        self.log("\n🔍 Verificando variables configuradas...")
        
        result = self.exec_cmd("grep -E 'AWS_|STRIPE_|TWILIO_|SENDGRID_|SENTRY_' /opt/inmova-app/.env.production | grep -v '^#'")
        
        if result and result['exit'] == 0:
            vars_found = result['output'].strip().split('\n')
            self.log(f"   Variables configuradas: {len(vars_found)}")
            
            for var in vars_found:
                if 'placeholder' not in var and 'your-' not in var:
                    key = var.split('=')[0]
                    self.log(f"   ✅ {key}")
                else:
                    key = var.split('=')[0]
                    self.log(f"   ⚠️  {key} (placeholder)")
    
    def restart_app(self):
        self.log("\n♻️  REINICIANDO APLICACIÓN")
        self.log("=" * 70)
        
        result = self.exec_cmd("cd /opt/inmova-app && pm2 restart inmova-app --update-env")
        
        if result and result['exit'] == 0:
            self.log("✅ PM2 reiniciado")
            self.log("⏳ Esperando warm-up (15 segundos)...")
            time.sleep(15)
            
            # Verificar health
            result = self.exec_cmd("curl -s http://localhost:3000/api/health")
            if result and result['exit'] == 0 and 'ok' in result['output']:
                self.log("✅ App funcionando correctamente")
                return True
            else:
                self.log("⚠️  Health check no responde como esperado")
                self.log(f"   Response: {result['output'][:200] if result else 'None'}")
                return False
        else:
            self.log("❌ Error reiniciando PM2")
            return False
    
    def test_integrations(self):
        self.log("\n🧪 TESTEANDO INTEGRACIONES")
        self.log("=" * 70)
        
        # AWS S3 Test (solo verificar si está configurado)
        self.log("\n1. AWS S3:")
        result = self.exec_cmd("grep AWS_ACCESS_KEY_ID /opt/inmova-app/.env.production")
        if result and result['exit'] == 0:
            if 'placeholder' in result['output'] or 'your-' in result['output']:
                self.log("   ⚠️  Configurado con placeholder")
                self.log("   ⚠️  Funcionalidades de upload NO funcionarán hasta configurar credenciales reales")
            else:
                self.log("   ✅ Credenciales configuradas")
                self.log("   ℹ️  Test de conexión requiere código de aplicación")
        
        # Stripe Test
        self.log("\n2. Stripe:")
        result = self.exec_cmd("grep STRIPE_SECRET_KEY /opt/inmova-app/.env.production")
        if result and result['exit'] == 0:
            if 'placeholder' in result['output'] or 'sk_test_' in result['output']:
                self.log("   ⚠️  Configurado con placeholder/test key")
                self.log("   ⚠️  Funcionalidades de pago NO funcionarán hasta configurar credenciales reales")
            else:
                self.log("   ✅ Credenciales configuradas")
                self.log("   ℹ️  Test de conexión requiere código de aplicación")
        
        # Twilio
        self.log("\n3. Twilio:")
        result = self.exec_cmd("grep TWILIO_ACCOUNT_SID /opt/inmova-app/.env.production")
        if result and result['exit'] == 0 and result['output'].strip():
            self.log("   ✅ Configurado")
        else:
            self.log("   ⚠️  No configurado (opcional)")
        
        # SendGrid
        self.log("\n4. SendGrid:")
        result = self.exec_cmd("grep SENDGRID_API_KEY /opt/inmova-app/.env.production")
        if result and result['exit'] == 0 and result['output'].strip():
            self.log("   ✅ Configurado")
        else:
            self.log("   ⚠️  No configurado (opcional)")
        
        # Sentry
        self.log("\n5. Sentry:")
        result = self.exec_cmd("grep SENTRY_DSN /opt/inmova-app/.env.production")
        if result and result['exit'] == 0 and result['output'].strip():
            self.log("   ✅ Configurado")
        else:
            self.log("   ⚠️  No configurado (opcional)")
    
    def generate_report(self):
        self.log("\n" + "=" * 70)
        self.log("📊 REPORTE FASE 2.5")
        self.log("=" * 70)
        
        self.log("\n✅ INTEGRATIONS CONFIGURADAS")
        self.log("")
        self.log("⚠️  IMPORTANTE:")
        self.log("   - Si usaste placeholders, las funcionalidades NO funcionarán")
        self.log("   - Actualiza las credenciales reales cuando las obtengas")
        self.log("   - Reinicia la app después de actualizar: pm2 restart inmova-app --update-env")
        self.log("")
        self.log("🔗 URLs para obtener credenciales:")
        self.log("   AWS: https://console.aws.amazon.com/iam/")
        self.log("   Stripe: https://dashboard.stripe.com/apikeys")
        self.log("   Twilio: https://console.twilio.com/")
        self.log("   SendGrid: https://app.sendgrid.com/settings/api_keys")
        self.log("   Sentry: https://sentry.io/settings/")
    
    def disconnect(self):
        if self.client:
            self.client.close()
            self.log("🔌 Desconectado")

def main():
    print("=" * 70)
    print("🔌 FASE 2.5: CONFIGURACIÓN DE INTEGRACIONES")
    print("=" * 70)
    print()
    
    phase = Phase25Integrations()
    
    try:
        if not phase.connect():
            return 1
        
        # Backup
        phase.backup_env()
        
        # Leer .env actual
        current_env = phase.read_current_env()
        if not current_env:
            print("❌ No se pudo leer .env.production")
            return 1
        
        # Obtener credenciales del usuario
        credentials = phase.get_credentials_from_user()
        
        # Actualizar .env
        if not phase.update_env_file(current_env, credentials):
            return 1
        
        # Verificar
        phase.verify_env_variables()
        
        # Restart app
        phase.restart_app()
        
        # Test integrations
        phase.test_integrations()
        
        # Reporte
        phase.generate_report()
        
        print("\n" + "=" * 70)
        print("✅ FASE 2.5 COMPLETADA")
        print("=" * 70)
        
        return 0
        
    except KeyboardInterrupt:
        print("\n⚠️  Interrumpido por usuario")
        return 1
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        phase.disconnect()

if __name__ == '__main__':
    sys.exit(main())
