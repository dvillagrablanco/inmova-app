#!/usr/bin/env python3
import sys, time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('157.180.119.236', username='root', password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=', timeout=15)
APP = '/opt/inmova-app'
def run(cmd, t=600):
    print(f"[{time.strftime('%H:%M:%S')}] {cmd[:120]}")
    _, o, e = client.exec_command(cmd, timeout=t)
    o.channel.recv_exit_status()
    out = o.read().decode('utf-8',errors='replace').strip()
    if out:
        for l in out.split('\n')[-8:]: print(f"  {l}")
    return out

run(f"cd {APP} && git pull origin main 2>&1 | tail -3")

# Añadir CRON_SECRET al servidor
run(f"grep -q CRON_SECRET {APP}/.env.production || echo 'CRON_SECRET=inmova-cron-2026-secret' >> {APP}/.env.production")

run(f"cd {APP} && npm run build 2>&1 | tail -3")
run(f"cd {APP} && pm2 reload inmova-app --update-env 2>&1 | tail -3")
time.sleep(20)

# Verificar los que antes fallaban
print("\n=== VERIFICACIÓN POST-FIX ===")
for api in ['/api/audit-logs', '/api/dashboard/analytics', '/api/cron/process-contract-renewals',
            '/api/cron/check-coupons', '/api/suggestions', '/api/approvals/stats']:
    out = run(f"curl -s -w '\\nHTTP:%{{http_code}}' 'http://localhost:3000{api}' --max-time 10 | tail -3")
    lines = out.split('\n')
    http = [l for l in lines if l.startswith('HTTP:')]
    code = http[0].replace('HTTP:', '') if http else '?'
    body_line = [l for l in lines if not l.startswith('HTTP:')]
    body = body_line[0][:80] if body_line else ''
    ok = code in ['200', '401']
    print(f"  {'✅' if ok else '❌'} {code} {api} {body[:60]}")

out = run("curl -s -o /dev/null -w '%{http_code}' 'http://localhost:3000/portal-proveedor/rese%C3%B1as' --max-time 10")
print(f"  {'✅' if out.strip()=='200' else '❌'} {out.strip()} /portal-proveedor/reseñas")

print("\n=== COMPLETADO ===")
client.close()
