#!/usr/bin/env python3
"""Upload new CAMT.053 files to server and import bank movements."""
import sys, os
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = {
    'hostname': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}
APP = '/opt/inmova-app'

FILES = [
    {
        'local': '/tmp/bankinter-drive/BANCOS/Fichero_peticion_2026-02-01_2026-03-06.xml',
        'remote_dir': f'{APP}/data/vidaro/bancos',
        'remote_name': 'Fichero_peticion_2026-02-01_2026-03-06.xml',
        'company': 'Viroda/Vidaro',
    },
    {
        'local': '/tmp/bankinter-drive/BANCOS/Fichero_peticion_2026-02-01_2026-03-06 rovida.xml',
        'remote_dir': f'{APP}/data/rovida/bancos',
        'remote_name': 'Fichero_peticion_2026-02-01_2026-03-06.xml',
        'company': 'Rovida',
    },
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(**SERVER)
c.get_transport().set_keepalive(30)
sftp = c.open_sftp()

def run(cmd, t=300):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return code, out, err

print("✅ Connected\n")

# 1. Upload files
print("[1/3] Uploading CAMT.053 files...")
for f in FILES:
    local_size = os.path.getsize(f['local'])
    remote_path = f"{f['remote_dir']}/{f['remote_name']}"
    
    # Ensure dir exists
    run(f"mkdir -p {f['remote_dir']}")
    
    sftp.put(f['local'], remote_path)
    print(f"   ✅ {f['company']}: {f['remote_name']} ({local_size // 1024}KB)")

sftp.close()
print()

# 2. Count transactions before
print("[2/3] Counting existing transactions...")
_, before, _ = run(f'''cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();
p.bankTransaction.count().then(c => {{ console.log(c); p.\\$disconnect(); }}).catch(e => {{ console.log('ERR:', e.message.substring(0,100)); p.\\$disconnect(); }});
" 2>&1''')
print(f"   Transactions before: {before}\n")

# 3. Run import
print("[3/3] Importing bank movements...")
code, out, err = run(f'''cd {APP} && export $(grep -v '^#' .env.production | grep -v '^$' | grep -v 'PRIVATE_KEY' | xargs) && npx tsx scripts/import-bank-movements-camt053.ts 2>&1 | tail -30''', t=120)
print(f"   Exit: {code}")
for line in out.split('\n'):
    if line.strip():
        print(f"   {line}")
if code != 0 and err:
    print(f"   ERR: {err[-200:]}")

# Count after
_, after, _ = run(f'''cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.bankTransaction.count(),
  p.bankTransaction.findFirst({{ orderBy: {{ fecha: 'desc' }}, select: {{ fecha: true, descripcion: true }} }}),
]).then(([c, latest]) => {{
  console.log('Total:', c);
  if (latest) console.log('Latest:', latest.fecha, '-', latest.descripcion);
  p.\\$disconnect();
}}).catch(e => {{ console.log('ERR:', e.message.substring(0,100)); p.\\$disconnect(); }});
" 2>&1''')
print(f"\n   {after}")

c.close()
new_txs = 'unknown'
try:
    new_txs = str(int(after.split('\n')[0].replace('Total: ', '')) - int(before))
except:
    pass
print(f"\n✅ Import completado. Nuevas transacciones: ~{new_txs}")
