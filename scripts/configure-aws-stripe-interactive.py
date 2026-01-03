#!/usr/bin/env python3
"""
CONFIGURACIÓN INTERACTIVA DE AWS S3 Y STRIPE
Solicita credenciales reales y las configura en el servidor
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime
from getpass import getpass

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

class AWSStripeConfigurator:
    def __init__(self):
        self.client = None
        self.logs = []
        self.credentials = {}
        
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
    
    def show_intro(self):
        print("\n" + "=" * 70)
        print("🔑 CONFIGURACIÓN DE AWS S3 Y STRIPE PARA INMOVA")
        print("=" * 70)
        print()
        print("Este script te ayudará a configurar:")
        print("  1. AWS S3 para uploads de archivos")
        print("  2. Stripe para procesamiento de pagos")
        print()
        print("⚠️  IMPORTANTE:")
        print("  - Necesitarás tener las credenciales listas")
        print("  - Si no las tienes, lee: GUIA_CONFIGURACION_AWS_STRIPE.md")
        print("  - Puedes usar test keys de Stripe para pruebas")
        print()
        input("Presiona Enter para continuar...")
    
    def get_aws_credentials(self):
        print("\n" + "=" * 70)
        print("☁️  AWS S3 CONFIGURATION")
        print("=" * 70)
        print()
        print("¿Tienes credenciales de AWS S3?")
        print("  - Si NO las tienes: Lee GUIA_CONFIGURACION_AWS_STRIPE.md")
        print("  - Si SÍ las tienes: Sigue adelante")
        print()
        
        has_aws = input("¿Continuar con AWS? (s/n): ").strip().lower()
        
        if has_aws != 's':
            print("⚠️  Saltando AWS. Puedes configurar después.")
            return False
        
        print()
        print("Ingresa tus credenciales AWS:")
        print()
        
        # Access Key ID
        while True:
            access_key = input("AWS_ACCESS_KEY_ID (AKIA...): ").strip()
            if access_key.startswith('AKIA') or access_key.startswith('ASIA'):
                self.credentials['AWS_ACCESS_KEY_ID'] = access_key
                break
            else:
                print("⚠️  Access Key debe empezar con AKIA o ASIA")
        
        # Secret Access Key
        secret_key = getpass("AWS_SECRET_ACCESS_KEY (oculto): ").strip()
        self.credentials['AWS_SECRET_ACCESS_KEY'] = secret_key
        
        # Region
        print()
        print("Regiones comunes:")
        print("  - eu-west-1 (Ireland)")
        print("  - eu-west-3 (Paris)")
        print("  - us-east-1 (Virginia)")
        region = input("AWS_REGION (default: eu-west-1): ").strip()
        self.credentials['AWS_REGION'] = region if region else 'eu-west-1'
        
        # Bucket
        print()
        bucket = input("AWS_BUCKET (nombre del bucket): ").strip()
        if not bucket:
            bucket = 'inmova-uploads-prod'
            print(f"⚠️  Usando default: {bucket}")
        self.credentials['AWS_BUCKET'] = bucket
        
        print()
        print("✅ Credenciales AWS ingresadas")
        return True
    
    def get_stripe_credentials(self):
        print("\n" + "=" * 70)
        print("💳 STRIPE CONFIGURATION")
        print("=" * 70)
        print()
        print("¿Tienes credenciales de Stripe?")
        print("  - Si NO las tienes: Lee GUIA_CONFIGURACION_AWS_STRIPE.md")
        print("  - Si SÍ las tienes: Sigue adelante")
        print()
        print("⚠️  IMPORTANTE:")
        print("  - sk_test_... : Modo pruebas (NO se cobrarán pagos reales)")
        print("  - sk_live_... : Modo producción (SÍ se cobrarán pagos reales)")
        print()
        
        has_stripe = input("¿Continuar con Stripe? (s/n): ").strip().lower()
        
        if has_stripe != 's':
            print("⚠️  Saltando Stripe. Puedes configurar después.")
            return False
        
        print()
        print("Ingresa tus credenciales Stripe:")
        print()
        
        # Secret Key
        while True:
            secret_key = getpass("STRIPE_SECRET_KEY (sk_test_... o sk_live_...): ").strip()
            if secret_key.startswith('sk_test_') or secret_key.startswith('sk_live_'):
                self.credentials['STRIPE_SECRET_KEY'] = secret_key
                
                # Detectar modo
                if secret_key.startswith('sk_test_'):
                    print("ℹ️  Modo TEST detectado")
                else:
                    print("⚠️  Modo LIVE detectado - Pagos REALES")
                break
            else:
                print("⚠️  Secret Key debe empezar con sk_test_ o sk_live_")
        
        # Public Key
        while True:
            public_key = input("STRIPE_PUBLIC_KEY (pk_test_... o pk_live_...): ").strip()
            if public_key.startswith('pk_test_') or public_key.startswith('pk_live_'):
                self.credentials['STRIPE_PUBLIC_KEY'] = public_key
                break
            else:
                print("⚠️  Public Key debe empezar con pk_test_ o pk_live_")
        
        # Webhook Secret (opcional)
        print()
        print("STRIPE_WEBHOOK_SECRET (opcional, presiona Enter para saltar):")
        webhook_secret = input("whsec_... : ").strip()
        if webhook_secret:
            self.credentials['STRIPE_WEBHOOK_SECRET'] = webhook_secret
        
        print()
        print("✅ Credenciales Stripe ingresadas")
        return True
    
    def confirm_credentials(self):
        print("\n" + "=" * 70)
        print("📋 CONFIRMACIÓN DE CREDENCIALES")
        print("=" * 70)
        print()
        print("Credenciales a configurar:")
        print()
        
        for key, value in self.credentials.items():
            # Ocultar parcialmente las credenciales sensibles
            if 'SECRET' in key or 'PASSWORD' in key:
                display_value = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
            else:
                display_value = value
            
            print(f"  {key}: {display_value}")
        
        print()
        confirm = input("¿Confirmas estas credenciales? (s/n): ").strip().lower()
        return confirm == 's'
    
    def backup_env(self):
        self.log("\n💾 Creando backup de .env.production...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result = self.exec_cmd(f"cp /opt/inmova-app/.env.production /opt/inmova-app/.env.production.backup_{timestamp}")
        if result and result['exit'] == 0:
            self.log(f"✅ Backup creado: .env.production.backup_{timestamp}")
        else:
            self.log("⚠️  No se pudo crear backup")
    
    def update_env_file(self):
        self.log("\n🔧 Actualizando .env.production en servidor...")
        
        # Leer .env actual
        result = self.exec_cmd("cat /opt/inmova-app/.env.production")
        if not result or result['exit'] != 0:
            self.log("❌ No se pudo leer .env.production")
            return False
        
        current_env = result['output']
        lines = current_env.split('\n')
        updated_lines = []
        updated_keys = set()
        
        # Actualizar líneas existentes
        for line in lines:
            if '=' in line and not line.strip().startswith('#'):
                key = line.split('=')[0].strip()
                if key in self.credentials:
                    updated_lines.append(f"{key}={self.credentials[key]}")
                    updated_keys.add(key)
                    self.log(f"   ✅ Actualizado: {key}")
                else:
                    updated_lines.append(line)
            else:
                updated_lines.append(line)
        
        # Añadir nuevas claves
        for key, value in self.credentials.items():
            if key not in updated_keys:
                updated_lines.append(f"{key}={value}")
                self.log(f"   ✅ Añadido: {key}")
        
        new_env = '\n'.join(updated_lines)
        
        # Escribir en servidor usando SFTP
        try:
            sftp = self.client.open_sftp()
            with sftp.file('/opt/inmova-app/.env.production', 'w') as f:
                f.write(new_env)
            sftp.close()
            
            self.log("✅ .env.production actualizado correctamente")
            return True
        except Exception as e:
            self.log(f"❌ Error escribiendo .env: {e}")
            return False
    
    def test_aws_credentials(self):
        if 'AWS_ACCESS_KEY_ID' not in self.credentials:
            return True  # No configuradas, skip
        
        self.log("\n🧪 Testeando credenciales AWS...")
        
        # Configurar AWS CLI
        config_cmds = [
            f"mkdir -p ~/.aws",
            f"echo '[default]\naws_access_key_id = {self.credentials['AWS_ACCESS_KEY_ID']}\naws_secret_access_key = {self.credentials['AWS_SECRET_ACCESS_KEY']}\nregion = {self.credentials['AWS_REGION']}' > ~/.aws/credentials",
            f"echo '[default]\nregion = {self.credentials['AWS_REGION']}\noutput = json' > ~/.aws/config"
        ]
        
        for cmd in config_cmds:
            self.exec_cmd(cmd)
        
        # Instalar AWS CLI si no está
        result = self.exec_cmd("which aws")
        if not result or result['exit'] != 0:
            self.log("   Instalando AWS CLI...")
            self.exec_cmd("apt-get update -qq && apt-get install -y awscli", timeout=120)
        
        # Test listar buckets
        result = self.exec_cmd("aws s3 ls 2>&1", timeout=30)
        
        if result and result['exit'] == 0:
            self.log("   ✅ Credenciales AWS válidas")
            
            # Verificar si el bucket existe
            bucket = self.credentials['AWS_BUCKET']
            if bucket in result['output']:
                self.log(f"   ✅ Bucket '{bucket}' encontrado")
            else:
                self.log(f"   ⚠️  Bucket '{bucket}' no encontrado")
                self.log(f"   ℹ️  Crear bucket: aws s3 mb s3://{bucket}")
            
            return True
        else:
            self.log("   ❌ Credenciales AWS inválidas o sin permisos")
            if result:
                self.log(f"   Error: {result['error'][:200]}")
            return False
    
    def test_stripe_credentials(self):
        if 'STRIPE_SECRET_KEY' not in self.credentials:
            return True  # No configuradas, skip
        
        self.log("\n🧪 Testeando credenciales Stripe...")
        
        secret_key = self.credentials['STRIPE_SECRET_KEY']
        
        # Test API call
        cmd = f"curl -s https://api.stripe.com/v1/balance -u {secret_key}:"
        result = self.exec_cmd(cmd, timeout=30)
        
        if result and result['exit'] == 0:
            output = result['output']
            if '"object": "balance"' in output or 'available' in output:
                self.log("   ✅ Credenciales Stripe válidas")
                
                # Extraer balance
                if 'available' in output:
                    self.log("   ℹ️  Stripe conectado correctamente")
                
                return True
            else:
                self.log("   ❌ Credenciales Stripe inválidas")
                self.log(f"   Error: {output[:200]}")
                return False
        else:
            self.log("   ❌ No se pudo conectar a Stripe API")
            return False
    
    def restart_app(self):
        self.log("\n♻️  REINICIANDO APLICACIÓN")
        self.log("=" * 70)
        
        result = self.exec_cmd("cd /opt/inmova-app && pm2 restart inmova-app --update-env")
        
        if result and result['exit'] == 0:
            self.log("✅ PM2 reiniciado correctamente")
            self.log("⏳ Esperando warm-up (15 segundos)...")
            time.sleep(15)
            
            # Verificar health
            result = self.exec_cmd("curl -s http://localhost:3000/api/health")
            if result and 'ok' in result['output']:
                self.log("✅ Aplicación funcionando correctamente")
                return True
            else:
                self.log("⚠️  Health check no responde como esperado")
                return False
        else:
            self.log("❌ Error reiniciando PM2")
            return False
    
    def show_final_report(self):
        print("\n" + "=" * 70)
        print("📊 CONFIGURACIÓN COMPLETADA")
        print("=" * 70)
        print()
        print("✅ Credenciales configuradas:")
        print()
        
        if 'AWS_ACCESS_KEY_ID' in self.credentials:
            print("☁️  AWS S3:")
            print(f"   - Region: {self.credentials['AWS_REGION']}")
            print(f"   - Bucket: {self.credentials['AWS_BUCKET']}")
            print("   - Status: ✅ Configurado")
            print()
        
        if 'STRIPE_SECRET_KEY' in self.credentials:
            print("💳 Stripe:")
            mode = "TEST" if self.credentials['STRIPE_SECRET_KEY'].startswith('sk_test_') else "LIVE"
            print(f"   - Modo: {mode}")
            print("   - Status: ✅ Configurado")
            print()
        
        print("🔗 URLs:")
        print("   - Aplicación: https://inmovaapp.com")
        print("   - Health: https://inmovaapp.com/api/health")
        print()
        print("🧪 Próximos pasos:")
        print("   1. Probar upload de archivo en la app")
        if 'STRIPE_SECRET_KEY' in self.credentials:
            if self.credentials['STRIPE_SECRET_KEY'].startswith('sk_test_'):
                print("   2. Probar pago con tarjeta test: 4242 4242 4242 4242")
            else:
                print("   2. Probar pago REAL (⚠️  LIVE mode activo)")
        print()
        print("📝 Logs:")
        print("   pm2 logs inmova-app")
        print()
    
    def disconnect(self):
        if self.client:
            self.client.close()
            self.log("🔌 Desconectado del servidor")

def main():
    configurator = AWSStripeConfigurator()
    
    try:
        # Intro
        configurator.show_intro()
        
        # Obtener credenciales
        has_aws = configurator.get_aws_credentials()
        has_stripe = configurator.get_stripe_credentials()
        
        if not has_aws and not has_stripe:
            print("\n⚠️  No se configuraron credenciales.")
            print("Ejecuta este script nuevamente cuando tengas las credenciales.")
            return 0
        
        # Confirmar
        if not configurator.confirm_credentials():
            print("\n❌ Configuración cancelada.")
            return 0
        
        # Conectar a servidor
        print()
        if not configurator.connect():
            return 1
        
        # Backup
        configurator.backup_env()
        
        # Actualizar .env
        if not configurator.update_env_file():
            return 1
        
        # Test credenciales
        if has_aws:
            configurator.test_aws_credentials()
        
        if has_stripe:
            configurator.test_stripe_credentials()
        
        # Reiniciar app
        configurator.restart_app()
        
        # Reporte final
        configurator.show_final_report()
        
        return 0
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Configuración interrumpida por usuario")
        return 1
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        configurator.disconnect()

if __name__ == '__main__':
    sys.exit(main())
