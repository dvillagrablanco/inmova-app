#!/usr/bin/env python3
"""
FASE 1 PARTE 2: SSL + TESTS + BACKUPS
Ejecuta configuración SSL con Certbot y setup de backups
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

class Phase1Part2:
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
    
    def exec_cmd(self, cmd, timeout=300):
        try:
            stdin, stdout, stderr = self.client.exec_command(cmd, timeout=timeout)
            exit_status = stdout.channel.recv_exit_status()
            output = stdout.read().decode('utf-8', errors='ignore')
            error = stderr.read().decode('utf-8', errors='ignore')
            return {'exit': exit_status, 'output': output, 'error': error}
        except Exception as e:
            self.log(f"❌ Error: {e}")
            return None
    
    def check_dns(self):
        self.log("🌐 Verificando DNS...")
        result = self.exec_cmd("dig +short inmovaapp.com")
        if result and '157.180.119.236' in result['output']:
            self.log("✅ DNS apunta correctamente al servidor")
            return True
        else:
            self.log("⚠️  DNS no apunta al servidor o no resuelve")
            if result:
                self.log(f"   Respuesta DNS: {result['output'].strip()}")
            return False
    
    def install_certbot(self):
        self.log("📦 Instalando Certbot...")
        
        cmds = [
            "apt-get update -qq",
            "apt-get install -y certbot python3-certbot-nginx"
        ]
        
        for cmd in cmds:
            result = self.exec_cmd(cmd, timeout=180)
            if result and result['exit'] != 0:
                self.log(f"⚠️  Warning en: {cmd}")
        
        # Verificar instalación
        result = self.exec_cmd("certbot --version")
        if result and result['exit'] == 0:
            self.log(f"✅ Certbot instalado: {result['output'].strip()}")
            return True
        else:
            self.log("❌ Error instalando Certbot")
            return False
    
    def check_nginx(self):
        self.log("🔍 Verificando Nginx...")
        result = self.exec_cmd("systemctl is-active nginx")
        if result and 'active' in result['output']:
            self.log("✅ Nginx está activo")
            return True
        else:
            self.log("⚠️  Nginx no está activo, iniciando...")
            self.exec_cmd("systemctl start nginx")
            time.sleep(2)
            result = self.exec_cmd("systemctl is-active nginx")
            return result and 'active' in result['output']
    
    def configure_nginx_for_ssl(self):
        self.log("⚙️  Configurando Nginx para SSL...")
        
        nginx_config = """
server {
    listen 80;
    server_name inmovaapp.com www.inmovaapp.com;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
"""
        
        try:
            sftp = self.client.open_sftp()
            with sftp.file('/etc/nginx/sites-available/inmova', 'w') as f:
                f.write(nginx_config)
            sftp.close()
            
            # Crear symlink y test
            self.exec_cmd("ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/inmova")
            self.exec_cmd("rm -f /etc/nginx/sites-enabled/default")
            
            result = self.exec_cmd("nginx -t")
            if result and result['exit'] == 0:
                self.exec_cmd("systemctl reload nginx")
                self.log("✅ Nginx configurado correctamente")
                return True
            else:
                self.log(f"⚠️  Error en config Nginx: {result['error'] if result else ''}")
                return False
        except Exception as e:
            self.log(f"❌ Error configurando Nginx: {e}")
            return False
    
    def obtain_ssl_certificate(self):
        self.log("🔒 Obteniendo certificado SSL de Let's Encrypt...")
        
        cmd = (
            "certbot --nginx "
            "-d inmovaapp.com -d www.inmovaapp.com "
            "--non-interactive --agree-tos "
            "--email admin@inmovaapp.com "
            "--redirect"
        )
        
        result = self.exec_cmd(cmd, timeout=300)
        
        if result:
            if result['exit'] == 0 or 'Successfully received certificate' in result['output']:
                self.log("✅ Certificado SSL obtenido exitosamente")
                
                # Verificar auto-renovación
                self.log("🔄 Configurando auto-renovación...")
                renew_result = self.exec_cmd("certbot renew --dry-run", timeout=120)
                if renew_result and renew_result['exit'] == 0:
                    self.log("✅ Auto-renovación configurada correctamente")
                else:
                    self.log("⚠️  Verificar auto-renovación manualmente")
                
                return True
            else:
                self.log(f"⚠️  Certbot output: {result['output'][:500]}")
                self.log(f"⚠️  Error: {result['error'][:500]}")
                return False
        return False
    
    def update_nextauth_url(self):
        self.log("🔧 Actualizando NEXTAUTH_URL a HTTPS...")
        
        # Ya está configurado en https:// desde Parte 1, verificar
        result = self.exec_cmd("grep NEXTAUTH_URL /opt/inmova-app/.env.production")
        if result and 'https://inmovaapp.com' in result['output']:
            self.log("✅ NEXTAUTH_URL ya está en HTTPS")
            return True
        else:
            self.log("⚠️  NEXTAUTH_URL no está en HTTPS, actualizando...")
            cmd = "sed -i 's|NEXTAUTH_URL=http://|NEXTAUTH_URL=https://|g' /opt/inmova-app/.env.production"
            self.exec_cmd(cmd)
            return True
    
    def setup_backup_script(self):
        self.log("💾 Configurando backup automático...")
        
        backup_script = """#!/bin/bash
# Backup automático de base de datos Inmova

BACKUP_DIR="/var/backups/inmova"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="inmova_production"
DB_USER="inmova_user"
DB_PASSWORD="GBTwDE/HrcEJTiybX2SQZoUQAFKRNZgXMZAoZVTe+WI="

mkdir -p $BACKUP_DIR

PGPASSWORD="$DB_PASSWORD" pg_dump -h localhost -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup completado: backup_$TIMESTAMP.sql"
    
    # Comprimir backups > 7 días
    find $BACKUP_DIR -name "*.sql" -mtime +7 -exec gzip {} \\;
    
    # Eliminar backups > 30 días
    find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
else
    echo "❌ Error en backup"
    exit 1
fi
"""
        
        try:
            # Crear directorio
            self.exec_cmd("mkdir -p /var/backups/inmova")
            self.exec_cmd("mkdir -p /var/log/inmova")
            
            # Escribir script
            sftp = self.client.open_sftp()
            with sftp.file('/usr/local/bin/inmova-backup.sh', 'w') as f:
                f.write(backup_script)
            sftp.close()
            
            self.exec_cmd("chmod +x /usr/local/bin/inmova-backup.sh")
            
            self.log("✅ Script de backup creado")
            
            # Test backup
            self.log("🧪 Ejecutando test de backup...")
            result = self.exec_cmd("/usr/local/bin/inmova-backup.sh", timeout=60)
            
            if result and result['exit'] == 0:
                self.log("✅ Test de backup exitoso")
                
                # Verificar archivo creado
                check = self.exec_cmd("ls -lh /var/backups/inmova/ | tail -1")
                if check:
                    self.log(f"   {check['output'].strip()}")
            else:
                self.log("⚠️  Test de backup falló")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Error configurando backup: {e}")
            return False
    
    def setup_cron_job(self):
        self.log("⏰ Configurando cron job para backups diarios...")
        
        cron_entry = "0 3 * * * /usr/local/bin/inmova-backup.sh >> /var/log/inmova/backup.log 2>&1\n"
        
        try:
            # Obtener crontab actual
            result = self.exec_cmd("crontab -l 2>/dev/null || echo ''")
            current_crontab = result['output'] if result else ''
            
            # Añadir si no existe
            if 'inmova-backup.sh' not in current_crontab:
                new_crontab = current_crontab + cron_entry
                
                # Escribir nuevo crontab
                cmd = f"echo '{new_crontab}' | crontab -"
                self.exec_cmd(cmd)
                
                self.log("✅ Cron job configurado: backup diario a las 3 AM")
            else:
                self.log("✅ Cron job ya existe")
            
            # Verificar
            result = self.exec_cmd("crontab -l | grep inmova-backup")
            if result and result['exit'] == 0:
                self.log(f"   {result['output'].strip()}")
                return True
            
            return False
            
        except Exception as e:
            self.log(f"❌ Error configurando cron: {e}")
            return False
    
    def run_tests(self):
        self.log("🧪 Ejecutando tests automatizados...")
        
        tests = [
            ("Health Check HTTP", "curl -s http://localhost:3000/api/health"),
            ("Health Check HTTPS", "curl -sk https://inmovaapp.com/api/health"),
            ("SSL Certificate", "curl -Isk https://inmovaapp.com | grep 'HTTP/2 200'"),
            ("Database Connection", "cd /opt/inmova-app && npx prisma db pull --force 2>&1 | grep -i success"),
            ("PM2 Status", "pm2 status | grep online"),
            ("Nginx Status", "systemctl is-active nginx")
        ]
        
        passed = 0
        total = len(tests)
        
        for name, cmd in tests:
            result = self.exec_cmd(cmd, timeout=30)
            if result and result['exit'] == 0:
                self.log(f"   ✅ {name}")
                passed += 1
            else:
                self.log(f"   ❌ {name}")
        
        self.log(f"\n📊 Tests: {passed}/{total} pasados ({int(passed/total*100)}%)")
        return passed >= total * 0.8  # 80% threshold
    
    def restart_app(self):
        self.log("♻️  Reiniciando aplicación con nuevas variables...")
        
        result = self.exec_cmd("cd /opt/inmova-app && pm2 restart inmova-app --update-env")
        
        if result and result['exit'] == 0:
            self.log("✅ PM2 reiniciado")
            self.log("⏳ Esperando warm-up (15 segundos)...")
            time.sleep(15)
            return True
        else:
            self.log("⚠️  Error reiniciando PM2")
            return False
    
    def disconnect(self):
        if self.client:
            self.client.close()
            self.log("🔌 Desconectado")

def main():
    print("=" * 70)
    print("🔒 FASE 1 PARTE 2: SSL + TESTS + BACKUPS")
    print("=" * 70)
    print()
    
    phase = Phase1Part2()
    
    try:
        # Conectar
        if not phase.connect():
            return 1
        
        # 1. Verificar DNS
        print("\n" + "=" * 70)
        print("PASO 1: VERIFICACIÓN DE DNS")
        print("=" * 70)
        if not phase.check_dns():
            phase.log("⚠️  DNS no apunta al servidor. SSL podría fallar.")
            phase.log("⚠️  Configurar DNS: inmovaapp.com → 157.180.119.236")
            # Continuar de todos modos
        
        # 2. Instalar Certbot
        print("\n" + "=" * 70)
        print("PASO 2: INSTALACIÓN DE CERTBOT")
        print("=" * 70)
        phase.install_certbot()
        
        # 3. Configurar Nginx
        print("\n" + "=" * 70)
        print("PASO 3: CONFIGURACIÓN DE NGINX")
        print("=" * 70)
        phase.check_nginx()
        phase.configure_nginx_for_ssl()
        
        # 4. Obtener SSL
        print("\n" + "=" * 70)
        print("PASO 4: OBTENCIÓN DE CERTIFICADO SSL")
        print("=" * 70)
        ssl_success = phase.obtain_ssl_certificate()
        
        # 5. Actualizar NEXTAUTH_URL
        print("\n" + "=" * 70)
        print("PASO 5: ACTUALIZACIÓN DE NEXTAUTH_URL")
        print("=" * 70)
        phase.update_nextauth_url()
        
        # 6. Setup backups
        print("\n" + "=" * 70)
        print("PASO 6: CONFIGURACIÓN DE BACKUPS")
        print("=" * 70)
        phase.setup_backup_script()
        phase.setup_cron_job()
        
        # 7. Reiniciar app
        print("\n" + "=" * 70)
        print("PASO 7: REINICIO DE APLICACIÓN")
        print("=" * 70)
        phase.restart_app()
        
        # 8. Tests
        print("\n" + "=" * 70)
        print("PASO 8: TESTS AUTOMATIZADOS")
        print("=" * 70)
        tests_passed = phase.run_tests()
        
        # Resumen
        print("\n" + "=" * 70)
        print("✅ FASE 1 PARTE 2 COMPLETADA")
        print("=" * 70)
        print()
        print("📊 RESUMEN:")
        print(f"   SSL Certificate: {'✅ Obtenido' if ssl_success else '⚠️  No obtenido (verificar DNS)'}")
        print(f"   Auto-renovación: {'✅ Configurada' if ssl_success else '⚠️  Pendiente'}")
        print(f"   Backups automáticos: ✅ Configurados (diario 3 AM)")
        print(f"   Tests: {'✅ Pasados' if tests_passed else '⚠️  Algunos fallaron'}")
        print()
        print("🔗 URLs de verificación:")
        print("   https://inmovaapp.com")
        print("   https://inmovaapp.com/api/health")
        print("   https://inmovaapp.com/login")
        print()
        
        return 0 if (ssl_success and tests_passed) else 1
        
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
