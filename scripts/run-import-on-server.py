#!/usr/bin/env python3
"""Run CAMT.053 import on server using dotenv instead of export."""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)
c.get_transport().set_keepalive(30)

APP = '/opt/inmova-app'

def run(cmd, t=300):
    print(f"$ {cmd[:120]}")
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return code, out, err

# Use DATABASE_URL directly (extracted safely)
_, db_url, _ = run(f'''grep "^DATABASE_URL" {APP}/.env.production | cut -d= -f2-''', t=5)
print(f"DB URL: {db_url[:40]}...\n")

# Count before
_, before, _ = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "const {{PrismaClient}}=require('@prisma/client');const p=new PrismaClient();p.bankTransaction.count().then(c=>{{console.log(c);p.\\$disconnect()}})" 2>&1''')
print(f"Transactions before: {before}\n")

# Run import with DATABASE_URL set directly
print("Running import...")
code, out, err = run(f'''cd {APP} && DATABASE_URL="{db_url}" npx tsx scripts/import-bank-movements-camt053.ts 2>&1 | tail -40''', t=180)
print(f"Exit: {code}")
for line in out.split('\n'):
    if line.strip():
        print(f"  {line}")
if code != 0 and err:
    for line in err.split('\n')[-5:]:
        print(f"  ERR: {line}")

# Count after
_, after, _ = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "const {{PrismaClient}}=require('@prisma/client');const p=new PrismaClient();Promise.all([p.bankTransaction.count(),p.bankTransaction.findFirst({{orderBy:{{fecha:'desc'}},select:{{fecha:true,descripcion:true}}}})]).then(([c,l])=>{{console.log('Total:',c);if(l)console.log('Latest:',l.fecha,'-',l.descripcion);p.\\$disconnect()}})" 2>&1''')
print(f"\n{after}")

c.close()
