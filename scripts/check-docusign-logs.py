#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)

def run(cmd, t=60):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore').strip()

APP = '/opt/inmova-app'

# 1. Check recent PM2 logs for DocuSign/operator errors
print("=== PM2 LOGS (last 50 lines, filtered) ===")
out = run("pm2 logs inmova-app --nostream --lines 100 2>&1 | grep -i 'docusign\\|operator\\|sign\\|envelope\\|error\\|Error' | tail -50")
print(out or "(no matching lines)")

print("\n=== PM2 ERROR LOGS (last 30) ===")
out = run("pm2 logs inmova-app --err --nostream --lines 30 2>&1")
print(out or "(empty)")

# 2. Check operator signature requests in DB
print("\n=== OPERATOR SIGNATURE REQUESTS IN DB ===")
out = run(f'''cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();
p.operatorSignatureRequest.findMany({{ take: 5, orderBy: {{ createdAt: 'desc' }} }}).then(r => {{
  r.forEach(x => console.log(x.id, '|', x.operatorName, '|', x.status, '|', x.signatureProvider || 'none', '|', x.signatureExternalId || 'no-envelope'));
  p.\\$disconnect();
}}).catch(e => {{ console.log('ERR:', e.message.substring(0,200)); p.\\$disconnect(); }});
" 2>&1''')
print(out or "(empty)")

# 3. Test DocuSign JWT auth directly
print("\n=== TEST DOCUSIGN JWT AUTH ===")
out = run(f'''cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" node -e "
require('dotenv').config({{ path: '.env.production' }});
const ds = require('docusign-esign');
const client = new ds.ApiClient();
client.setOAuthBasePath('account-d.docusign.com');
const pk = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\\\n/g, '\\n');
console.log('IK:', process.env.DOCUSIGN_INTEGRATION_KEY ? 'OK' : 'MISSING');
console.log('UID:', process.env.DOCUSIGN_USER_ID ? 'OK' : 'MISSING');
console.log('PK length:', pk.length);
console.log('PK starts:', pk.substring(0,30));
client.requestJWTUserToken(
  process.env.DOCUSIGN_INTEGRATION_KEY,
  process.env.DOCUSIGN_USER_ID,
  ['signature', 'impersonation'],
  Buffer.from(pk, 'utf8'),
  3600
).then(r => {{
  console.log('TOKEN OK:', r.body.access_token.substring(0,30) + '...');
  process.exit(0);
}}).catch(e => {{
  console.log('AUTH FAIL:', e?.response?.body?.error || e.message);
  process.exit(1);
}});
" 2>&1''', t=30)
print(out or "(no output)")

c.close()
