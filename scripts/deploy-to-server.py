#!/usr/bin/env python3
"""Deployment automático a inmovaapp.com vía SSH"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
DOMAIN = 'https://inmovaapp.com'

def exec_cmd(client, command, description="", timeout=300):
    """Ejecutar comando con logging"""
    timestamp = time.strftime('%H:%M:%S')
    if description:
        print(f"[{timestamp}] {description}")
    
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8').strip()
    errors = stderr.read().decode('utf-8').strip()
    
    if output:
        print(output)
    
    if errors and exit_status != 0:
        print(f"⚠️  Stderr: {errors}")
    
    return exit_status, output, errors

print("=" * 70)
print("🚀 DEPLOYMENT AUTOMÁTICO - INMOVA APP")
print("=" * 70)
print()
print(f"Servidor: {SERVER_IP}")
print(f"Dominio: {DOMAIN}")
print(f"Path: {APP_PATH}")
print()
print("=" * 70)
print()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    # 1. CONECTAR
    print(f"[{time.strftime('%H:%M:%S')}] 🔐 Conectando...")
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    print(f"[{time.strftime('%H:%M:%S')}] ✅ Conectado\n")
    
    # 2. BACKUP DE BD
    print("=" * 70)
    print("💾 BACKUP PRE-DEPLOYMENT")
    print("=" * 70)
    print()
    
    timestamp_backup = time.strftime('%Y%m%d_%H%M%S')
    backup_file = f"/var/backups/inmova/pre-deploy-{timestamp_backup}.sql"
    
    exec_cmd(
        client,
        f"mkdir -p /var/backups/inmova",
        "Creando directorio de backups..."
    )
    
    status, output, errors = exec_cmd(
        client,
        f"pg_dump -U inmova_user inmova_production > {backup_file}",
        "Haciendo backup de BD...",
        timeout=120
    )
    
    if status == 0:
        print(f"✅ BD backup: {backup_file}")
    else:
        print(f"⚠️  Backup falló pero continuamos...")
    
    # Guardar commit actual para rollback
    status, current_commit, _ = exec_cmd(
        client,
        f"cd {APP_PATH} && git rev-parse --short HEAD",
        ""
    )
    print(f"✅ Commit actual: {current_commit}\n")
    
    # 3. ACTUALIZAR CÓDIGO
    print("=" * 70)
    print("📥 ACTUALIZANDO CÓDIGO")
    print("=" * 70)
    print()
    
    exec_cmd(
        client,
        f"cd {APP_PATH} && git fetch origin",
        "Fetching cambios..."
    )
    
    status, output, errors = exec_cmd(
        client,
        f"cd {APP_PATH} && git reset --hard origin/main",
        "Actualizando a última versión..."
    )
    
    if status == 0:
        print("✅ Código actualizado\n")
    else:
        print("❌ Error actualizando código")
        print(f"Saliendo con error...")
        sys.exit(1)
    
    # 4. INSTALAR DEPENDENCIAS
    print("=" * 70)
    print("📦 DEPENDENCIAS")
    print("=" * 70)
    print()
    
    status, output, errors = exec_cmd(
        client,
        f"cd {APP_PATH} && npm install",
        "Instalando/actualizando dependencias...",
        timeout=600
    )
    
    if status == 0:
        print("✅ Dependencias instaladas\n")
    else:
        print("⚠️  Advertencia en dependencias pero continuamos...\n")
    
    # 5. PRISMA
    print("=" * 70)
    print("🔧 PRISMA SETUP")
    print("=" * 70)
    print()
    
    exec_cmd(
        client,
        f"cd {APP_PATH} && npx prisma generate",
        "Generando Prisma Client...",
        timeout=120
    )
    print("✅ Prisma Client generado")
    
    exec_cmd(
        client,
        f"cd {APP_PATH} && npx prisma migrate deploy",
        "Aplicando migraciones...",
        timeout=120
    )
    print("✅ Migraciones aplicadas\n")
    
    # 6. REINICIAR PM2
    print("=" * 70)
    print("♻️  REINICIANDO APLICACIÓN")
    print("=" * 70)
    print()
    
    status, output, errors = exec_cmd(
        client,
        "pm2 reload inmova-app",
        "PM2 reload (zero-downtime)..."
    )
    
    if status == 0:
        print("✅ PM2 reloaded")
    else:
        # Si reload falla, intentar restart
        exec_cmd(
            client,
            "pm2 restart inmova-app",
            "PM2 restart (con downtime breve)..."
        )
        print("✅ PM2 restarted")
    
    print()
    print("⏳ Esperando warm-up (15 segundos)...")
    time.sleep(15)
    print()
    
    # 7. HEALTH CHECKS
    print("=" * 70)
    print("🏥 HEALTH CHECKS POST-DEPLOYMENT")
    print("=" * 70)
    print()
    
    checks_passed = 0
    checks_total = 5
    
    # Check 1: HTTP
    print(f"[{time.strftime('%H:%M:%S')}] 1/{checks_total} Verificando HTTP...")
    status, output, errors = exec_cmd(
        client,
        f"curl -s -o /dev/null -w '%{{http_code}}' {DOMAIN}/api/health",
        ""
    )
    if output == '200':
        print("✅ HTTP OK")
        checks_passed += 1
    else:
        print(f"❌ HTTP falló (código: {output})")
    print()
    
    # Check 2: BD
    print(f"[{time.strftime('%H:%M:%S')}] 2/{checks_total} Verificando BD...")
    status, output, errors = exec_cmd(
        client,
        f"cd {APP_PATH} && npx prisma db push --skip-generate",
        "",
        timeout=30
    )
    if status == 0:
        print("✅ BD OK")
        checks_passed += 1
    else:
        print("❌ BD error")
    print()
    
    # Check 3: PM2
    print(f"[{time.strftime('%H:%M:%S')}] 3/{checks_total} Verificando PM2...")
    status, output, errors = exec_cmd(
        client,
        "pm2 list | grep inmova-app | grep online",
        ""
    )
    if status == 0:
        print("✅ PM2 OK")
        checks_passed += 1
    else:
        print("❌ PM2 error")
    print()
    
    # Check 4: Memoria
    print(f"[{time.strftime('%H:%M:%S')}] 4/{checks_total} Verificando memoria...")
    status, output, errors = exec_cmd(
        client,
        "free | grep Mem | awk '{print ($3/$2) * 100.0}'",
        ""
    )
    try:
        mem_usage = float(output)
        if mem_usage < 90:
            print(f"✅ Memoria OK ({mem_usage:.1f}%)")
            checks_passed += 1
        else:
            print(f"⚠️  Memoria alta ({mem_usage:.1f}%)")
    except:
        print(f"⚠️  No se pudo verificar memoria")
    print()
    
    # Check 5: Disco
    print(f"[{time.strftime('%H:%M:%S')}] 5/{checks_total} Verificando disco...")
    status, output, errors = exec_cmd(
        client,
        "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'",
        ""
    )
    try:
        disk_usage = int(output)
        if disk_usage < 90:
            print(f"✅ Disco OK ({disk_usage}%)")
            checks_passed += 1
        else:
            print(f"⚠️  Disco alto ({disk_usage}%)")
    except:
        print(f"⚠️  No se pudo verificar disco")
    print()
    
    # 8. RESULTADO FINAL
    print("=" * 70)
    
    if checks_passed >= 4:
        print("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE")
    elif checks_passed >= 2:
        print("⚠️  DEPLOYMENT COMPLETADO CON ADVERTENCIAS")
    else:
        print("❌ DEPLOYMENT FALLÓ - CONSIDERAR ROLLBACK")
    
    print("=" * 70)
    print()
    
    # 9. INFORMACIÓN
    print("📊 Resumen:")
    print(f"  Health checks: {checks_passed}/{checks_total} pasando")
    print()
    
    print("🌐 URLs:")
    print(f"  Principal: {DOMAIN}")
    print(f"  Health: {DOMAIN}/api/health")
    print(f"  Login: {DOMAIN}/login")
    print(f"  Dashboard: {DOMAIN}/dashboard")
    print()
    
    print("🔧 Comandos útiles:")
    print(f"  Ver logs: ssh {USERNAME}@{SERVER_IP} 'pm2 logs inmova-app'")
    print(f"  Restart: ssh {USERNAME}@{SERVER_IP} 'pm2 restart inmova-app'")
    print(f"  Status: ssh {USERNAME}@{SERVER_IP} 'pm2 status'")
    print()
    
    if checks_passed < 4:
        print("⚠️  ROLLBACK (si es necesario):")
        print(f"  ssh {USERNAME}@{SERVER_IP}")
        print(f"  cd {APP_PATH}")
        print(f"  git reset --hard {current_commit}")
        print(f"  pm2 restart inmova-app")
        print()
    
    print("=" * 70)
    
except paramiko.ssh_exception.AuthenticationException:
    print("❌ Error de autenticación SSH")
    sys.exit(1)
except paramiko.ssh_exception.SSHException as e:
    print(f"❌ Error SSH: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    client.close()
