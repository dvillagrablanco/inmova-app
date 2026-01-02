#!/usr/bin/env python3
"""Despliegue del sistema de blindaje de BD"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import os

SERVER_HOST = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASS = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    
    print("🛡️ DESPLEGANDO SISTEMA DE BLINDAJE DE BASE DE DATOS\n")
    
    # 1. Crear directorio de blindaje
    print("1️⃣  Creando directorio de scripts...")
    stdin, stdout, stderr = client.exec_command(f"mkdir -p {APP_DIR}/scripts/blindaje-db")
    stdout.channel.recv_exit_status()
    print("   ✅ Directorio creado")
    
    # 2. Subir scripts
    print("\n2️⃣  Subiendo scripts de blindaje...")
    sftp = client.open_sftp()
    
    scripts = [
        '01-backup-automatico.sh',
        '02-verificar-integridad.sh',
        '03-restaurar-config.sh',
        '04-deploy-seguro.sh',
        'README.md'
    ]
    
    for script in scripts:
        local_path = f'/workspace/scripts/blindaje-db/{script}'
        remote_path = f'{APP_DIR}/scripts/blindaje-db/{script}'
        
        with open(local_path, 'r') as f:
            content = f.read()
        
        remote_file = sftp.open(remote_path, 'w')
        remote_file.write(content)
        remote_file.close()
        
        # Dar permisos de ejecución a scripts .sh
        if script.endswith('.sh'):
            stdin, stdout, stderr = client.exec_command(f"chmod +x {remote_path}")
            stdout.channel.recv_exit_status()
        
        print(f"   ✅ {script}")
    
    sftp.close()
    
    # 3. Crear directorio de backups
    print("\n3️⃣  Creando directorio de backups...")
    stdin, stdout, stderr = client.exec_command("mkdir -p /opt/inmova-backups")
    stdout.channel.recv_exit_status()
    stdin, stdout, stderr = client.exec_command("chmod 700 /opt/inmova-backups")
    stdout.channel.recv_exit_status()
    print("   ✅ /opt/inmova-backups creado")
    
    # 4. Ejecutar primer backup
    print("\n4️⃣  Ejecutando primer backup...")
    stdin, stdout, stderr = client.exec_command(f"bash {APP_DIR}/scripts/blindaje-db/01-backup-automatico.sh")
    
    import time
    time.sleep(5)
    
    output = stdout.read().decode()
    if "BACKUP COMPLETADO" in output:
        print("   ✅ Backup inicial creado")
    else:
        print("   ⚠️  Posible problema con backup:")
        print(output[-300:])
    
    # 5. Configurar cron jobs
    print("\n5️⃣  Configurando cron jobs...")
    
    cron_entries = f"""
# Inmova - Backup diario de BD (2 AM)
0 2 * * * {APP_DIR}/scripts/blindaje-db/01-backup-automatico.sh >> /var/log/inmova-backup.log 2>&1

# Inmova - Verificación de integridad cada 6 horas
0 */6 * * * {APP_DIR}/scripts/blindaje-db/02-verificar-integridad.sh >> /var/log/inmova-integrity.log 2>&1 || {APP_DIR}/scripts/blindaje-db/03-restaurar-config.sh >> /var/log/inmova-restore.log 2>&1
"""
    
    # Obtener crontab actual
    stdin, stdout, stderr = client.exec_command("crontab -l 2>/dev/null || true")
    current_cron = stdout.read().decode()
    
    # Si no tiene las entradas de Inmova, añadirlas
    if "Inmova - Backup" not in current_cron:
        new_cron = current_cron + cron_entries
        stdin, stdout, stderr = client.exec_command(f"echo '{new_cron}' | crontab -")
        stdout.channel.recv_exit_status()
        print("   ✅ Cron jobs configurados")
    else:
        print("   ℹ️  Cron jobs ya estaban configurados")
    
    # 6. Verificar integridad actual
    print("\n6️⃣  Verificando integridad del sistema...")
    stdin, stdout, stderr = client.exec_command(f"bash {APP_DIR}/scripts/blindaje-db/02-verificar-integridad.sh")
    
    time.sleep(3)
    
    output = stdout.read().decode()
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code == 0:
        print("   ✅ Sistema íntegro")
    else:
        print("   ⚠️  Sistema con problemas, restaurando...")
        stdin, stdout, stderr = client.exec_command(f"bash {APP_DIR}/scripts/blindaje-db/03-restaurar-config.sh")
        output = stdout.read().decode()
        print(output[-500:])
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ SISTEMA DE BLINDAJE DESPLEGADO")
    print("")
    print("📋 Scripts disponibles:")
    print(f"   - Backup: bash {APP_DIR}/scripts/blindaje-db/01-backup-automatico.sh")
    print(f"   - Verificar: bash {APP_DIR}/scripts/blindaje-db/02-verificar-integridad.sh")
    print(f"   - Restaurar: bash {APP_DIR}/scripts/blindaje-db/03-restaurar-config.sh")
    print(f"   - Deploy seguro: bash {APP_DIR}/scripts/blindaje-db/04-deploy-seguro.sh")
    print("")
    print("📦 Backups en: /opt/inmova-backups/")
    print("📊 Logs en: /var/log/inmova-*.log")
    print("")
    print("🔐 Configuración protegida:")
    print("   - .env.production")
    print("   - ecosystem.config.js")
    print("   - create-superadmin.js")
    print("   - Base de datos PostgreSQL")
    print("")
    print("⏰ Cron jobs activos:")
    print("   - Backup diario: 2:00 AM")
    print("   - Verificación: Cada 6 horas")
    print("")
    print("🚀 PRÓXIMO DEPLOY:")
    print(f"   bash {APP_DIR}/scripts/blindaje-db/04-deploy-seguro.sh")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
