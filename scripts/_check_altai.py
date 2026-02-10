#!/usr/bin/env python3
import sys, time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('157.180.119.236', username='root', password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=', timeout=15)

def run(cmd, timeout=30):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out or err

# 1. Check env vars para Altai
print("=== Variables Altai en .env.production ===")
print(run("grep -i 'ZUCCHETTI\\|ALTAI' /opt/inmova-app/.env.production 2>/dev/null || echo 'Nada encontrado'"))

# 2. Check env vars en proceso PM2
print("\n=== Variables Altai en PM2 env ===")
print(run("cat /proc/$(pm2 pid inmova-app 2>/dev/null | head -1)/environ 2>/dev/null | tr '\\0' '\\n' | grep -i 'ZUCCHETTI\\|ALTAI' || echo 'Nada en PM2'"))

# 3. Check estado Zucchetti de las empresas
print("\n=== Estado Zucchetti en BD ===")
run_sql = """cat > /tmp/_q.sql << 'ENDSQL'
SELECT nombre, "zucchettiEnabled", "zucchettiCompanyId", "zucchettiLastSync"
FROM company
WHERE nombre ILIKE '%rovida%' OR nombre ILIKE '%viroda%' OR nombre ILIKE '%vidaro%';
ENDSQL"""
run(run_sql)
time.sleep(0.3)
print(run("PGPASSWORD=InmovaSecure2026 psql -h 127.0.0.1 -U inmova_user -d inmova_production -f /tmp/_q.sql"))

client.close()
