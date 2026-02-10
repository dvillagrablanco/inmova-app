#!/usr/bin/env python3
"""Deploy + importar contabilidad Rovida + corregir companyId usuario"""
import sys, time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

S = '157.180.119.236'
P = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP = '/opt/inmova-app'
DB = 'postgresql://inmova_user:InmovaSecure2026@localhost:5432/inmova_production'

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(S, username='root', password=P, timeout=15)

def run(cmd, timeout=300):
    log(f"$ {cmd[:120]}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        for l in out.split('\n')[-20:]:
            print(f"  {l}")
    if err and code != 0:
        for l in err.split('\n')[-5:]:
            print(f"  [ERR] {l}")
    return code, out

log("=== DEPLOY + IMPORTAR CONTABILIDAD ROVIDA ===\n")

# 1. Pull
log("1. Actualizar código")
run(f"cd {APP} && git pull origin main 2>&1 | tail -5")

# 2. Install + prisma
log("\n2. Dependencias + Prisma")
run(f"cd {APP} && npm install --legacy-peer-deps 2>&1 | tail -3", timeout=600)
run(f"cd {APP} && npx prisma generate 2>&1 | tail -3", timeout=120)
run(f"cd {APP} && npx prisma db push --accept-data-loss 2>&1 | tail -3", timeout=120)

# 3. Build
log("\n3. Build")
run(f"cd {APP} && npm run build 2>&1 | tail -5", timeout=600)

# 4. Reload PM2
log("\n4. Reload PM2")
run(f"cd {APP} && pm2 reload inmova-app --update-env 2>&1 | tail -5")
log("Warm-up 15s...")
time.sleep(15)

# 5. Descargar contabilidad xlsx al servidor
log("\n5. Descargar spreadsheet contabilidad Rovida")
run(f'curl -L -o /tmp/rovida_contabilidad.xlsx "https://docs.google.com/spreadsheets/d/1uRerjVupuKFKpkATavimTElFbI9DG_b8/export?format=xlsx" 2>&1 | tail -3', timeout=60)
run("ls -la /tmp/rovida_contabilidad.xlsx")

# 6. Instalar xlsx dependency si no existe
log("\n6. Asegurar dependencia xlsx")
run(f"cd {APP} && npm list xlsx 2>/dev/null || npm install xlsx --no-save 2>&1 | tail -3", timeout=60)

# 7. Importar contabilidad
log("\n7. Importar contabilidad de Rovida")
run(f"cd {APP} && DATABASE_URL='{DB}' XLSX_PATH=/tmp/rovida_contabilidad.xlsx npx tsx scripts/import-rovida-contabilidad.ts 2>&1", timeout=180)

# 8. Corregir companyId usuario a Vidaro (holding)
log("\n8. Corregir companyId de dvillagra a Vidaro (holding)")
sql = """UPDATE users SET "companyId" = (SELECT id FROM company WHERE nombre ILIKE '%vidaro inversiones%' LIMIT 1) WHERE email='dvillagra@vidaroinversiones.com' AND "companyId" != (SELECT id FROM company WHERE nombre ILIKE '%vidaro inversiones%' LIMIT 1);"""
# Write SQL to file then execute
run(f"cat > /tmp/_fix.sql << 'EOF'\n{sql}\nEOF")
time.sleep(0.3)
run(f"PGPASSWORD=InmovaSecure2026 psql -h 127.0.0.1 -U inmova_user -d inmova_production -f /tmp/_fix.sql")

# Verificar
run(f"""cat > /tmp/_verify.sql << 'EOF'
SELECT u.email, c.nombre as empresa_principal FROM users u JOIN company c ON u."companyId"=c.id WHERE u.email='dvillagra@vidaroinversiones.com';
SELECT count(*) as transacciones_rovida FROM accounting_transactions WHERE "companyId" IN (SELECT id FROM company WHERE nombre ILIKE '%rovida%');
EOF""")
time.sleep(0.3)
run("PGPASSWORD=InmovaSecure2026 psql -h 127.0.0.1 -U inmova_user -d inmova_production -f /tmp/_verify.sql")

# 9. Health check
log("\n9. Health check")
run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health --max-time 10")
run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login --max-time 10")

log("\n=== DEPLOY COMPLETADO ===")
client.close()
