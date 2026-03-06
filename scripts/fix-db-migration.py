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
    print(f"$ {cmd[:140]}")
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return code, out, err

APP = '/opt/inmova-app'
print("Connected\n")

# Check DATABASE_URL
print("[1] Check DATABASE_URL...")
code, out, _ = run(f"cd {APP} && grep '^DATABASE_URL' .env.production | head -1 | cut -c1-50")
print(f"   {out}...\n")

# Run prisma db push with env loaded
print("[2] Running prisma db push with env loaded...")
code, out, err = run(f"cd {APP} && export $(grep -v '^#' .env.production | grep -v '^$' | xargs) && npx prisma db push --accept-data-loss 2>&1", t=120)
print(f"   Exit: {code}")
for line in (out or '').split('\n')[-15:]:
    print(f"   {line}")
if code != 0 and err:
    for line in err.split('\n')[-5:]:
        print(f"   ERR: {line}")
print()

# If that failed, try with dotenv
if code != 0:
    print("[2b] Trying alternative method...")
    code, out, err = run(f'cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" npx prisma db push --accept-data-loss 2>&1', t=120)
    print(f"   Exit: {code}")
    for line in (out or '').split('\n')[-10:]:
        print(f"   {line}")
    print()

# Verify
print("[3] Verify table exists...")
code, out, _ = run(f'cd {APP} && export $(grep -v "^#" .env.production | grep -v "^$" | xargs) && node -e "const {{ PrismaClient }} = require(\'@prisma/client\'); const p = new PrismaClient(); p.\\$queryRawUnsafe(\'SELECT COUNT(*) as cnt FROM operator_signature_requests\').then(r => {{ console.log(\'OK:\', JSON.stringify(r)); process.exit(0); }}).catch(e => {{ console.log(\'FAIL:\', e.message.substring(0,100)); process.exit(1); }})" 2>&1')
print(f"   {out}\n")

# Restart
print("[4] Restart PM2...")
run(f"cd {APP} && pm2 restart inmova-app --update-env")
print("   Waiting 20s...")
time.sleep(20)
_, h, _ = run("curl -sf http://localhost:3000/api/health", t=15)
print(f"   Health: {'OK' if h and 'ok' in h.lower() else h or 'NO RESPONSE'}")

c.close()
print("\nDone.")
