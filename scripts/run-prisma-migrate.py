#!/usr/bin/env python3
import sys, time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)
c.get_transport().set_keepalive(30)

def run(cmd, t=300):
    print(f"$ {cmd[:120]}")
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return code, out, err

APP = '/opt/inmova-app'

print("✅ Connected\n")

# 1. Run prisma db push to create missing tables
print("[1] Running prisma db push...")
code, out, err = run(f"cd {APP} && npx prisma db push --accept-data-loss 2>&1", t=120)
print(f"   Exit: {code}")
for line in (out or err).split('\n')[-10:]:
    print(f"   {line}")
print()

# 2. Verify table exists
print("[2] Verifying table...")
code, out, err = run(f"""cd {APP} && node -e "
require('dotenv').config({{ path: '.env.production' }});
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRaw\`SELECT COUNT(*) FROM operator_signature_requests\`.then(r => {{
  console.log('✅ Table exists, count:', JSON.stringify(r));
  p.\$disconnect();
}}).catch(e => {{
  console.log('❌ Error:', e.message);
  p.\$disconnect();
}});
" 2>&1""")
print(f"   {out}")
print()

# 3. Restart PM2
print("[3] Restarting PM2...")
run(f"cd {APP} && pm2 restart inmova-app --update-env")
print("   Waiting 20s...")
time.sleep(20)

# 4. Quick health check
_, h, _ = run("curl -sf http://localhost:3000/api/health", t=15)
print(f"\n   Health: {'✅' if h and 'ok' in h.lower() else '⚠️ ' + (h or 'NO RESPONSE')}")

c.close()
print("\n✅ Done. Tabla operator_signature_requests creada.")
