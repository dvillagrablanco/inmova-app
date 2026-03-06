#!/usr/bin/env python3
"""Configure GoCardless live credentials on production server."""
import sys, time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)

def run(cmd, t=60):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    return code, out

APP = '/opt/inmova-app'

print("✅ Connected\n")

# 1. Remove old GoCardless config
print("[1/4] Updating GoCardless credentials...")
run(f"cd {APP} && sed -i '/^GOCARDLESS/d' .env.production")
run(f"cd {APP} && sed -i '/^# === GOCARDLESS/d' .env.production")

# 2. Add new credentials
config = """
# === GOCARDLESS (SEPA Direct Debit + Open Banking / Nordigen) ===
GOCARDLESS_ACCESS_TOKEN=live_ceZp1a8lsm7AiKzj9NC3l9ZcggAgpENehHqcyVuo
GOCARDLESS_ENVIRONMENT=live
"""

sftp = c.open_sftp()
with sftp.file('/tmp/_gc_cfg.txt', 'w') as f:
    f.write(config)
sftp.close()

run(f"cat /tmp/_gc_cfg.txt >> {APP}/.env.production && rm /tmp/_gc_cfg.txt")
print("   ✅ Credentials written\n")

# 3. Verify
print("[2/4] Verifying...")
_, out = run(f"cd {APP} && grep '^GOCARDLESS' .env.production")
for line in out.split('\n'):
    if 'TOKEN' in line:
        print(f"   ✅ {line[:40]}...")
    else:
        print(f"   ✅ {line}")

# 4. Restart PM2
print("\n[3/4] Restarting PM2...")
run(f"cd {APP} && pm2 restart inmova-app --update-env")
print("   ✅ Restarted. Waiting 20s...")
time.sleep(20)

# 5. Health + test
print("\n[4/4] Verify...")
_, h = run("curl -sf http://localhost:3000/api/health")
print(f"   Health: {'✅ OK' if h and 'ok' in h.lower() else '⚠️ ' + (h or 'NO RESPONSE')}")

_, login = run("curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/login")
print(f"   Login: {'✅' if login == '200' else '⚠️'} HTTP {login}")

# Test GoCardless connection
_, gc = run(f'''cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" node -e "
require('dotenv').config({{ path: '.env.production' }});
const token = process.env.GOCARDLESS_ACCESS_TOKEN;
const env = process.env.GOCARDLESS_ENVIRONMENT;
console.log('Token:', token ? token.substring(0,10) + '...' : 'MISSING');
console.log('Environment:', env);
console.log('Configured:', !!(token && env));
// Quick API test
const https = require('https');
const options = {{
  hostname: 'api.gocardless.com',
  path: '/creditors',
  method: 'GET',
  headers: {{
    'Authorization': 'Bearer ' + token,
    'GoCardless-Version': '2015-07-06',
    'Content-Type': 'application/json'
  }}
}};
const req = https.request(options, (res) => {{
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {{
    if (res.statusCode === 200) {{
      const parsed = JSON.parse(data);
      const creditor = parsed.creditors && parsed.creditors[0];
      if (creditor) {{
        console.log('Creditor:', creditor.name);
        console.log('Scheme:', creditor.scheme_identifiers ? creditor.scheme_identifiers.map(s => s.scheme).join(', ') : 'none');
        console.log('GoCardless ID:', creditor.id);
      }}
      console.log('API: ✅ OK');
    }} else {{
      console.log('API: ❌ HTTP', res.statusCode, data.substring(0,200));
    }}
  }});
}});
req.on('error', e => console.log('API: ❌', e.message));
req.end();
" 2>&1''')
print(f"   GoCardless:\n   {gc.replace(chr(10), chr(10) + '   ')}")

c.close()
print("\n✅ GoCardless configurado en producción.")
