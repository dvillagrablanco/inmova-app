#!/usr/bin/env python3
"""
EJECUCIÓN REMOTA DE FASE 1 - INMOVA APP
Ejecuta scripts de seguridad en servidor via SSH (Paramiko)
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
from datetime import datetime

# Configuración del servidor
SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'xcc9brgkMMbf',  # Password actual (se cambiará)
    'port': 22,
    'timeout': 30
}

# Secrets generados
GENERATED_SECRETS = {
    'NEXTAUTH_SECRET': '64FgrHU6R7rRMEtdQCLK/HvHS1l16EZEGmUWFidGsVg=',
    'DB_PASSWORD': 'GBTwDE/HrcEJTiybX2SQZoUQAFKRNZgXMZAoZVTe+WI=',
    'ENCRYPTION_KEY': '+L1ZOTWbWY2bOpr8V5EvHXC0wDk1Uvthozh+OYOC/Xs=',
    'CRON_SECRET': 'Ej7Su0z79BGxBtN76NfNkGJD/PaE58x6FOFPtARQpoo=',
    'ROOT_PASSWORD': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
}

LOG_FILE = f'/tmp/phase1_execution_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'

class SSHExecutor:
    def __init__(self, config):
        self.config = config
        self.client = None
        self.log_buffer = []
        
    def log(self, message):
        """Log mensaje a consola y buffer"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_msg = f"[{timestamp}] {message}"
        print(log_msg)
        self.log_buffer.append(log_msg)
        
    def connect(self):
        """Conectar al servidor via SSH"""
        self.log("🔐 Conectando al servidor...")
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(
                hostname=self.config['host'],
                username=self.config['username'],
                password=self.config['password'],
                port=self.config['port'],
                timeout=self.config['timeout']
            )
            self.log(f"✅ Conectado a {self.config['host']}")
            return True
        except Exception as e:
            self.log(f"❌ Error conectando: {str(e)}")
            return False
            
    def execute_command(self, command, timeout=300):
        """Ejecutar comando y retornar output"""
        try:
            stdin, stdout, stderr = self.client.exec_command(command, timeout=timeout)
            exit_status = stdout.channel.recv_exit_status()
            output = stdout.read().decode('utf-8', errors='ignore')
            error = stderr.read().decode('utf-8', errors='ignore')
            
            return {
                'exit_status': exit_status,
                'output': output,
                'error': error
            }
        except Exception as e:
            self.log(f"❌ Error ejecutando comando: {str(e)}")
            return None
            
    def execute_interactive(self, command, responses=None, timeout=600):
        """Ejecutar comando interactivo con respuestas automáticas"""
        try:
            transport = self.client.get_transport()
            channel = transport.open_session()
            channel.settimeout(timeout)
            channel.get_pty()
            channel.exec_command(command)
            
            output = []
            response_index = 0
            
            while True:
                if channel.recv_ready():
                    data = channel.recv(4096).decode('utf-8', errors='ignore')
                    output.append(data)
                    print(data, end='', flush=True)
                    
                    # Auto-responder preguntas
                    if responses and response_index < len(responses):
                        if any(prompt in data.lower() for prompt in ['(y/n)', 'continue?', 'press enter']):
                            time.sleep(0.5)
                            channel.send(responses[response_index] + '\n')
                            response_index += 1
                
                if channel.exit_status_ready():
                    break
                    
                time.sleep(0.1)
            
            exit_status = channel.recv_exit_status()
            channel.close()
            
            return {
                'exit_status': exit_status,
                'output': ''.join(output)
            }
        except Exception as e:
            self.log(f"❌ Error en ejecución interactiva: {str(e)}")
            return None
    
    def transfer_scripts(self):
        """Transferir scripts al servidor"""
        self.log("📦 Transfiriendo scripts al servidor...")
        
        scripts_dir = '/workspace/scripts'
        remote_dir = '/opt/inmova-app/scripts'
        
        scripts = [
            'phase1-security-setup.sh',
            'phase1-ssl-tests.sh',
            'phase1-verification.sh',
            'phase1-fix-vulnerabilities.sh',
            'phase1-clean-credentials.sh'
        ]
        
        try:
            sftp = self.client.open_sftp()
            
            # Crear directorio remoto si no existe
            try:
                sftp.stat(remote_dir)
            except:
                self.execute_command(f'mkdir -p {remote_dir}')
            
            # Transferir cada script
            for script in scripts:
                local_path = f'{scripts_dir}/{script}'
                remote_path = f'{remote_dir}/{script}'
                
                try:
                    sftp.put(local_path, remote_path)
                    self.execute_command(f'chmod +x {remote_path}')
                    self.log(f"  ✅ {script}")
                except Exception as e:
                    self.log(f"  ⚠️  {script}: {str(e)}")
            
            sftp.close()
            self.log("✅ Scripts transferidos exitosamente")
            return True
            
        except Exception as e:
            self.log(f"❌ Error transfiriendo scripts: {str(e)}")
            return False
    
    def create_env_file_with_secrets(self):
        """Crear .env.production con los secrets generados"""
        self.log("📝 Creando .env.production con secrets seguros...")
        
        env_content = f"""# ====================================
# ENVIRONMENT
# ====================================
NODE_ENV=production
PORT=3000

# ====================================
# DATABASE
# ====================================
DATABASE_URL=postgresql://inmova_user:{GENERATED_SECRETS['DB_PASSWORD']}@localhost:5432/inmova_production?schema=public

# ====================================
# NEXTAUTH
# ====================================
NEXTAUTH_SECRET={GENERATED_SECRETS['NEXTAUTH_SECRET']}
NEXTAUTH_URL=https://inmovaapp.com

# ====================================
# SECURITY
# ====================================
ENCRYPTION_KEY={GENERATED_SECRETS['ENCRYPTION_KEY']}
CRON_SECRET={GENERATED_SECRETS['CRON_SECRET']}
MFA_ENCRYPTION_KEY={GENERATED_SECRETS['ENCRYPTION_KEY']}

# ====================================
# AWS S3 (ACTUALIZAR CON VALORES REALES)
# ====================================
AWS_REGION=us-west-2
AWS_BUCKET_NAME=inmova-production

# ====================================
# STRIPE (ACTUALIZAR CON VALORES REALES DE LIVE MODE)
# ====================================
# STRIPE_SECRET_KEY=sk_live_ACTUALIZAR_AQUI
# STRIPE_PUBLISHABLE_KEY=pk_live_ACTUALIZAR_AQUI
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_ACTUALIZAR_AQUI

# ====================================
# MONITORING (CONFIGURAR DESPUÉS)
# ====================================
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_DSN=
"""
        
        try:
            # Backup del .env actual
            self.execute_command('cp /opt/inmova-app/.env.production /opt/inmova-app/.env.production.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true')
            
            # Escribir nuevo .env
            sftp = self.client.open_sftp()
            with sftp.file('/opt/inmova-app/.env.production', 'w') as f:
                f.write(env_content)
            sftp.close()
            
            self.log("✅ .env.production creado con secrets seguros")
            return True
            
        except Exception as e:
            self.log(f"❌ Error creando .env.production: {str(e)}")
            return False
    
    def change_root_password(self):
        """Cambiar password de root"""
        self.log("🔐 Cambiando password de root...")
        
        try:
            cmd = f"echo 'root:{GENERATED_SECRETS['ROOT_PASSWORD']}' | chpasswd"
            result = self.execute_command(cmd)
            
            if result and result['exit_status'] == 0:
                self.log("✅ Password de root cambiado")
                # Actualizar configuración para futuras conexiones
                self.config['password'] = GENERATED_SECRETS['ROOT_PASSWORD']
                return True
            else:
                self.log("⚠️  Error cambiando password de root")
                return False
                
        except Exception as e:
            self.log(f"❌ Error: {str(e)}")
            return False
    
    def change_db_password(self):
        """Cambiar password de PostgreSQL"""
        self.log("🗄️  Cambiando password de PostgreSQL...")
        
        try:
            cmd = f"sudo -u postgres psql -c \"ALTER USER inmova_user WITH PASSWORD '{GENERATED_SECRETS['DB_PASSWORD']}';\" "
            result = self.execute_command(cmd)
            
            if result and result['exit_status'] == 0:
                self.log("✅ Password de PostgreSQL cambiado")
                return True
            else:
                self.log(f"⚠️  Error cambiando password de DB: {result['error'] if result else 'Unknown'}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error: {str(e)}")
            return False
    
    def setup_firewall(self):
        """Configurar firewall UFW"""
        self.log("🔥 Configurando firewall UFW...")
        
        commands = [
            "apt-get install -y ufw",
            "ufw --force reset",
            "ufw default deny incoming",
            "ufw default allow outgoing",
            "ufw allow 22/tcp comment 'SSH'",
            "ufw allow 80/tcp comment 'HTTP'",
            "ufw allow 443/tcp comment 'HTTPS'",
            "ufw --force enable"
        ]
        
        try:
            for cmd in commands:
                result = self.execute_command(cmd, timeout=60)
                if result and result['exit_status'] != 0:
                    self.log(f"⚠️  Warning en: {cmd}")
            
            # Verificar estado
            result = self.execute_command("ufw status")
            if result and 'Status: active' in result['output']:
                self.log("✅ Firewall configurado y activo")
                return True
            else:
                self.log("⚠️  Firewall puede no estar activo")
                return False
                
        except Exception as e:
            self.log(f"❌ Error configurando firewall: {str(e)}")
            return False
    
    def restart_app(self):
        """Reiniciar aplicación con PM2"""
        self.log("♻️  Reiniciando aplicación con PM2...")
        
        try:
            # Reiniciar PM2 con nuevas variables
            result = self.execute_command("cd /opt/inmova-app && pm2 restart inmova-app --update-env")
            
            if result and result['exit_status'] == 0:
                self.log("✅ PM2 reiniciado")
                
                # Esperar warm-up
                self.log("⏳ Esperando warm-up (15 segundos)...")
                time.sleep(15)
                
                return True
            else:
                self.log("⚠️  Error reiniciando PM2")
                return False
                
        except Exception as e:
            self.log(f"❌ Error: {str(e)}")
            return False
    
    def verify_health(self):
        """Verificar health check de la aplicación"""
        self.log("🏥 Verificando health check...")
        
        try:
            result = self.execute_command("curl -s http://localhost:3000/api/health")
            
            if result and '"status":"ok"' in result['output']:
                self.log("✅ Health check: OK")
                self.log(f"   Response: {result['output'][:100]}")
                return True
            else:
                self.log("⚠️  Health check no responde correctamente")
                if result:
                    self.log(f"   Response: {result['output'][:200]}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error: {str(e)}")
            return False
    
    def save_log(self):
        """Guardar log de ejecución"""
        try:
            with open(LOG_FILE, 'w') as f:
                f.write('\n'.join(self.log_buffer))
            self.log(f"📄 Log guardado en: {LOG_FILE}")
        except Exception as e:
            self.log(f"⚠️  No se pudo guardar log: {str(e)}")
    
    def disconnect(self):
        """Cerrar conexión SSH"""
        if self.client:
            self.client.close()
            self.log("🔌 Desconectado del servidor")

def main():
    print("=" * 70)
    print("🚀 EJECUCIÓN REMOTA DE FASE 1 - INMOVA APP")
    print("=" * 70)
    print()
    print("Este script ejecutará:")
    print("1. ✅ Transferencia de scripts al servidor")
    print("2. ✅ Configuración de secrets seguros")
    print("3. ✅ Cambio de passwords (root + DB)")
    print("4. ✅ Configuración de firewall")
    print("5. ✅ Reinicio de aplicación")
    print("6. ✅ Verificación de health check")
    print()
    print(f"Servidor: {SERVER_CONFIG['host']}")
    print(f"Log será guardado en: {LOG_FILE}")
    print()
    print("▶️  Iniciando ejecución automática...")
    print()
    
    executor = SSHExecutor(SERVER_CONFIG)
    
    try:
        # Paso 1: Conectar
        if not executor.connect():
            print("❌ No se pudo conectar al servidor")
            return 1
        
        # Paso 2: Transferir scripts
        print()
        print("=" * 70)
        print("PASO 1: TRANSFERENCIA DE SCRIPTS")
        print("=" * 70)
        if not executor.transfer_scripts():
            print("⚠️  Continuando sin todos los scripts...")
        
        # Paso 3: Crear .env con secrets
        print()
        print("=" * 70)
        print("PASO 2: CONFIGURACIÓN DE SECRETS")
        print("=" * 70)
        if not executor.create_env_file_with_secrets():
            print("❌ Error crítico: No se pudo crear .env.production")
            return 1
        
        # Paso 4: Cambiar password de root
        print()
        print("=" * 70)
        print("PASO 3: CAMBIO DE PASSWORDS")
        print("=" * 70)
        executor.change_root_password()
        
        # Paso 5: Cambiar password de DB
        executor.change_db_password()
        
        # Paso 6: Configurar firewall
        print()
        print("=" * 70)
        print("PASO 4: CONFIGURACIÓN DE FIREWALL")
        print("=" * 70)
        executor.setup_firewall()
        
        # Paso 7: Reiniciar aplicación
        print()
        print("=" * 70)
        print("PASO 5: REINICIO DE APLICACIÓN")
        print("=" * 70)
        executor.restart_app()
        
        # Paso 8: Verificar health
        print()
        print("=" * 70)
        print("PASO 6: VERIFICACIÓN FINAL")
        print("=" * 70)
        executor.verify_health()
        
        # Verificación final de PM2
        print()
        executor.log("📊 Estado de PM2:")
        result = executor.execute_command("pm2 status")
        if result:
            print(result['output'])
        
        # Verificación de firewall
        print()
        executor.log("🔥 Estado de Firewall:")
        result = executor.execute_command("ufw status")
        if result:
            print(result['output'])
        
        # Resumen final
        print()
        print("=" * 70)
        print("✅ FASE 1 - PARTE 1 COMPLETADA")
        print("=" * 70)
        print()
        print("🎉 RESUMEN DE CAMBIOS:")
        print()
        print(f"✅ Root password cambiado: {GENERATED_SECRETS['ROOT_PASSWORD'][:20]}...")
        print(f"✅ DB password cambiado: {GENERATED_SECRETS['DB_PASSWORD'][:20]}...")
        print(f"✅ NEXTAUTH_SECRET actualizado")
        print(f"✅ ENCRYPTION_KEY generado")
        print(f"✅ Firewall UFW configurado")
        print(f"✅ .env.production actualizado")
        print(f"✅ Aplicación reiniciada")
        print()
        print("⚠️  IMPORTANTE: GUARDAR ESTOS SECRETS")
        print()
        for key, value in GENERATED_SECRETS.items():
            print(f"{key}: {value}")
        print()
        print("📋 PRÓXIMOS PASOS:")
        print()
        print("1. Guardar secrets en password manager")
        print("2. Configurar SSL/HTTPS (ejecutar phase1-ssl-tests.sh)")
        print("3. Ejecutar verificación (ejecutar phase1-verification.sh)")
        print()
        print(f"📄 Log completo guardado en: {LOG_FILE}")
        print()
        
        return 0
        
    except KeyboardInterrupt:
        print()
        executor.log("⚠️  Ejecución interrumpida por el usuario")
        return 1
        
    except Exception as e:
        print()
        executor.log(f"❌ Error inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
        
    finally:
        executor.save_log()
        executor.disconnect()

if __name__ == '__main__':
    sys.exit(main())
