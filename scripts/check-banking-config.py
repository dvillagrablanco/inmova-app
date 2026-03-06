#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)

APP = '/opt/inmova-app'

def run(cmd):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=30)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore').strip()

print("=== BANKING CONFIG ON SERVER ===\n")

# Check all banking-related env vars
out = run(f"cd {APP} && grep -iE '^(TINK|NORDIGEN|GOCARDLESS|BANKINTER|REDSYS|PLAID|SALT_EDGE|OPEN_BANKING|BANK)' .env.production 2>/dev/null")
if out:
    for line in out.split('\n'):
        # Mask tokens
        if '=' in line:
            key, val = line.split('=', 1)
            if len(val) > 20 and ('TOKEN' in key or 'SECRET' in key or 'KEY' in key):
                print(f"  ✅ {key}={val[:15]}...")
            else:
                print(f"  ✅ {key}={val}")
        else:
            print(f"  {line}")
else:
    print("  (no banking vars found)")

print("\n=== CAMT.053 FILES ON SERVER ===\n")
out = run(f"find {APP}/data -name '*.xml' -o -name '*camt*' -o -name '*Fichero*' 2>/dev/null | head -20")
if out:
    for line in out.split('\n'):
        print(f"  {line}")
else:
    print("  (no CAMT files found)")

print(f"\n=== BANK TRANSACTIONS IN DB ===\n")
out = run(f'''cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.bankTransaction.count(),
  p.bankConnection.count(),
  p.bankTransaction.findFirst({{ orderBy: {{ fecha: 'desc' }}, select: {{ fecha: true, descripcion: true }} }}),
  p.bankTransaction.findFirst({{ orderBy: {{ fecha: 'asc' }}, select: {{ fecha: true }} }}),
]).then(([txCount, connCount, latest, oldest]) => {{
  console.log('Transactions:', txCount);
  console.log('Connections:', connCount);
  if (oldest) console.log('Oldest:', oldest.fecha);
  if (latest) console.log('Latest:', latest.fecha, '-', latest.descripcion);
}}).catch(e => console.log('DB Error:', e.message.substring(0,150))).finally(() => p.\$disconnect());
" 2>&1''')
print(f"  {out.replace(chr(10), chr(10) + '  ')}")

print(f"\n=== SEPA PAYMENTS IN DB ===\n")
out = run(f'''cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();
p.sepaPayment.count().then(c => console.log('SEPA Payments:', c)).catch(e => console.log('No SepaPayment table or error:', e.message.substring(0,80))).finally(() => p.\$disconnect());
" 2>&1''')
print(f"  {out}")

c.close()
