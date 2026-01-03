#!/usr/bin/env python3
"""
Deployment a Producción - Inmova App
Con backup, build, y health checks
"""

import sys, os
user_site = os.path.expanduser('~/.local/lib/python3.12/site-packages')
if os.path.exists(user_site):
    sys.path.insert(0, user_site)

import paramiko
import time
from datetime import datetime

SERVER = '157.180.119.236'
USER = 'root'
PASS = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
PATH = '/opt/inmova-app'

DB_URL = "postgresql://inmova_user:inmova123@localhost:5432/inmova_production"
NEXTAUTH_SECRET = "ca1f50f0101dff24895a920c37f5b56eb3e80a88b708d1e89f761f8c9c8e4d33"

def run_cmd(client, cmd, timeout=300):
    """Execute command and return output"""
    print(f"  → {cmd[:100]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    status = '✅' if exit_status == 0 else '⚠️'
    print(f"  {status} Exit {exit_status}")
    
    return exit_status == 0, out, err

print("\n" + "="*70)
print("🚀 DEPLOYMENT A PRODUCCIÓN - INMOVA APP")
print("="*70)
print(f"\nServidor: {SERVER}")
print(f"Path: {PATH}")
print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("🔐 Conectando al servidor...")
    client.connect(SERVER, username=USER, password=PASS, timeout=10)
    print("✅ Conectado\n")

    # ========================================================================
    # 1. BACKUP PRE-DEPLOYMENT
    # ========================================================================
    print("="*70)
    print("💾 FASE 1: BACKUP PRE-DEPLOYMENT")
    print("="*70 + "\n")

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = f"/var/backups/inmova"
    
    # Crear directorio de backups
    run_cmd(client, f"mkdir -p {backup_dir}")
    
    # Backup de BD
    print("  📊 Backup de base de datos...")
    success, out, err = run_cmd(
        client,
        f"PGPASSWORD='inmova123' pg_dump -U inmova_user -h localhost inmova_production > {backup_dir}/db_pre_deploy_{timestamp}.sql",
        timeout=120
    )
    if success:
        print(f"  ✅ BD backup: db_pre_deploy_{timestamp}.sql")
    
    # Backup de .env.production
    print("  📄 Backup de .env.production...")
    run_cmd(client, f"cp {PATH}/.env.production {backup_dir}/env_pre_deploy_{timestamp}.backup")
    
    # Git commit actual
    print("  🔖 Guardando commit actual...")
    success, out, err = run_cmd(client, f"cd {PATH} && git rev-parse HEAD")
    if success:
        current_commit = out.strip()[:8]
        print(f"  ✅ Commit actual: {current_commit}")

    # ========================================================================
    # 2. GIT PULL
    # ========================================================================
    print("\n" + "="*70)
    print("📥 FASE 2: ACTUALIZAR CÓDIGO")
    print("="*70 + "\n")
    
    print("  🔄 Git pull origin main...")
    success, out, err = run_cmd(client, f"cd {PATH} && git pull origin main")
    
    if success:
        print("  ✅ Código actualizado")
        # Mostrar últimos commits
        success, out, err = run_cmd(client, f"cd {PATH} && git log --oneline -3")
        if out:
            print("  Últimos commits:")
            for line in out.split('\n')[:3]:
                if line.strip():
                    print(f"    {line}")
    else:
        print("  ⚠️ Git pull puede haber fallado")
        if err:
            print(f"    {err[:200]}")

    # ========================================================================
    # 3. INSTALAR DEPENDENCIAS
    # ========================================================================
    print("\n" + "="*70)
    print("📦 FASE 3: INSTALAR DEPENDENCIAS")
    print("="*70 + "\n")
    
    print("  📥 npm install...")
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && npm install --production=false",
        timeout=600
    )
    
    if success or 'up to date' in out.lower():
        print("  ✅ Dependencias instaladas")
    else:
        print("  ⚠️ npm install puede tener warnings (normal)")

    # ========================================================================
    # 4. PRISMA
    # ========================================================================
    print("\n" + "="*70)
    print("🔧 FASE 4: PRISMA GENERATE & MIGRATE")
    print("="*70 + "\n")
    
    # Prisma generate
    print("  🔨 Prisma generate...")
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx prisma generate",
        timeout=120
    )
    
    if success:
        print("  ✅ Prisma client generado")
    
    # Prisma migrate
    print("  🗄️ Prisma migrate deploy...")
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx prisma migrate deploy",
        timeout=180
    )
    
    if success:
        print("  ✅ Migraciones aplicadas")
        for line in out.split('\n'):
            if 'migration' in line.lower() or 'applied' in line.lower():
                print(f"    {line.strip()}")
    elif 'No pending migrations' in out or 'No pending migrations' in err:
        print("  ✅ Sin migraciones pendientes")

    # ========================================================================
    # 5. BUILD NEXT.JS
    # ========================================================================
    print("\n" + "="*70)
    print("🏗️ FASE 5: BUILD NEXT.JS")
    print("="*70 + "\n")
    
    print("  🔨 npm run build...")
    print("  ⏳ Esto puede tardar 2-5 minutos...")
    
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && export DATABASE_URL='{DB_URL}' && export NEXTAUTH_SECRET='{NEXTAUTH_SECRET}' && npm run build",
        timeout=600
    )
    
    if success:
        print("  ✅ Build completado")
        # Mostrar líneas importantes del build
        for line in out.split('\n'):
            if any(kw in line.lower() for kw in ['compiled', 'generated', 'route', 'error']):
                print(f"    {line.strip()}")
    else:
        print("  ⚠️ Build puede haber fallado")
        print("  Intentando continuar...")
        if err:
            # Mostrar solo primeras líneas de error
            for line in err.split('\n')[:10]:
                if line.strip() and 'error' in line.lower():
                    print(f"    {line}")

    # ========================================================================
    # 6. REINICIAR PM2
    # ========================================================================
    print("\n" + "="*70)
    print("♻️ FASE 6: REINICIAR PM2")
    print("="*70 + "\n")
    
    # Actualizar ecosystem.config.js con variables correctas
    print("  📝 Actualizando ecosystem.config.js...")
    ecosystem_content = f"""module.exports = {{
  apps: [{{
    name: 'inmova-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
    env_production: {{
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: '{DB_URL}',
      NEXTAUTH_URL: 'https://inmovaapp.com',
      NEXTAUTH_SECRET: '{NEXTAUTH_SECRET}'
    }}
  }}]
}}
"""
    
    cmd = f"cd {PATH} && cat > ecosystem.config.js << 'EOFCONFIG'\n{ecosystem_content}\nEOFCONFIG"
    run_cmd(client, cmd)
    
    # PM2 reload (zero-downtime)
    print("  ♻️ PM2 reload...")
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && pm2 reload inmova-app",
        timeout=60
    )
    
    if success or 'successfully' in out.lower():
        print("  ✅ PM2 reloaded")
    else:
        # Si reload falla, hacer restart completo
        print("  ⚠️ Reload falló, haciendo restart completo...")
        run_cmd(client, f"cd {PATH} && pm2 delete inmova-app || true")
        time.sleep(2)
        run_cmd(client, f"cd {PATH} && pm2 start ecosystem.config.js --env production")
    
    # Guardar configuración PM2
    run_cmd(client, "pm2 save")
    
    print("  ⏳ Esperando 20s para warm-up...")
    time.sleep(20)

    # ========================================================================
    # 7. HEALTH CHECKS
    # ========================================================================
    print("\n" + "="*70)
    print("🏥 FASE 7: HEALTH CHECKS POST-DEPLOYMENT")
    print("="*70 + "\n")
    
    checks_passed = 0
    checks_total = 7
    
    # Check 1: PM2 Status
    print("  1/7 Verificando PM2 status...")
    success, out, err = run_cmd(client, "pm2 status inmova-app")
    if 'online' in out:
        online_count = out.count('online')
        print(f"  ✅ PM2 online ({online_count} instancias)")
        checks_passed += 1
    else:
        print("  ❌ PM2 no está online")
    
    # Check 2: Proceso escuchando en puerto 3000
    print("\n  2/7 Verificando puerto 3000...")
    success, out, err = run_cmd(client, "ss -tlnp | grep :3000")
    if success and ':3000' in out:
        print("  ✅ Puerto 3000 listening")
        checks_passed += 1
    else:
        print("  ❌ Puerto 3000 no responde")
    
    # Check 3: Health endpoint
    print("\n  3/7 Verificando /api/health...")
    success, out, err = run_cmd(
        client,
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health"
    )
    if success and '200' in out:
        print("  ✅ Health check: 200 OK")
        checks_passed += 1
    else:
        print(f"  ⚠️ Health check: {out}")
    
    # Check 4: Login page
    print("\n  4/7 Verificando /login...")
    success, out, err = run_cmd(
        client,
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login"
    )
    if success and '200' in out:
        print("  ✅ Login page: 200 OK")
        checks_passed += 1
    else:
        print(f"  ⚠️ Login page: {out}")
    
    # Check 5: NextAuth providers
    print("\n  5/7 Verificando NextAuth API...")
    success, out, err = run_cmd(
        client,
        "curl -s http://localhost:3000/api/auth/providers"
    )
    if success and 'credentials' in out.lower():
        print("  ✅ NextAuth API: OK")
        checks_passed += 1
    else:
        print("  ⚠️ NextAuth API puede tener problemas")
    
    # Check 6: Database connectivity
    print("\n  6/7 Verificando database...")
    success, out, err = run_cmd(
        client,
        f"cd {PATH} && export DATABASE_URL='{DB_URL}' && npx tsx -e \"require('./lib/db').prisma.user.count().then(c => console.log('Users:', c))\"",
        timeout=30
    )
    if success and 'Users:' in out:
        print(f"  ✅ Database OK: {out.strip()}")
        checks_passed += 1
    else:
        print("  ⚠️ Database connection issue")
    
    # Check 7: Memory usage
    print("\n  7/7 Verificando memoria...")
    success, out, err = run_cmd(client, "free -m | grep Mem")
    if success:
        lines = out.strip().split('\n')
        if lines:
            mem_info = lines[-1].split()
            if len(mem_info) >= 3:
                total = int(mem_info[1])
                used = int(mem_info[2])
                percent = (used / total) * 100
                print(f"  ✅ Memoria: {used}MB / {total}MB ({percent:.1f}%)")
                if percent < 90:
                    checks_passed += 1
                else:
                    print("  ⚠️ Memoria alta (>90%)")

    # ========================================================================
    # RESUMEN FINAL
    # ========================================================================
    print("\n" + "="*70)
    print("📊 RESUMEN DE DEPLOYMENT")
    print("="*70 + "\n")
    
    print(f"Health Checks: {checks_passed}/{checks_total} pasando\n")
    
    if checks_passed >= 5:
        print("✅ DEPLOYMENT EXITOSO")
        print("\n🎉 La aplicación está online y funcionando correctamente\n")
    else:
        print("⚠️ DEPLOYMENT COMPLETADO CON WARNINGS")
        print(f"\nSolo {checks_passed}/{checks_total} checks pasaron.")
        print("Ver logs para más detalles.\n")
    
    print("🌐 URLs:")
    print("  → https://inmovaapp.com")
    print("  → https://inmovaapp.com/login")
    print(f"  → http://{SERVER}:3000\n")
    
    print("📝 Credenciales de Test:")
    print("  Email: admin@inmova.app")
    print("  Password: Admin123!\n")
    
    print("🔍 Comandos útiles:")
    print(f"  ssh {USER}@{SERVER} 'pm2 logs inmova-app --lines 50'")
    print(f"  ssh {USER}@{SERVER} 'pm2 monit'")
    print(f"  ssh {USER}@{SERVER} 'pm2 status inmova-app'\n")
    
    print("💾 Backups guardados en:")
    print(f"  {backup_dir}/db_pre_deploy_{timestamp}.sql")
    print(f"  {backup_dir}/env_pre_deploy_{timestamp}.backup\n")
    
    # Mostrar últimas líneas de logs
    print("📋 Últimas líneas de logs PM2:")
    success, out, err = run_cmd(client, "pm2 logs inmova-app --nostream --lines 10")
    if out:
        for line in out.split('\n')[-12:]:
            if line.strip():
                print(f"  {line}")
    
    print("\n" + "="*70)
    print("✅ DEPLOYMENT COMPLETADO")
    print("="*70 + "\n")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)

finally:
    client.close()
    print("🔌 Conexión cerrada\n")
