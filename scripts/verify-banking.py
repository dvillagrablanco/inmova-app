#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)

def run(cmd, t=30):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore').strip()

print("=== VERIFY BANKING ENDPOINTS ===\n")

# Tink status
out = run("curl -sf http://localhost:3000/api/open-banking/tink/connect 2>&1 | head -5")
print(f"Tink Connect: {out[:200]}\n")

# Bank sync cron status
out = run("curl -sf http://localhost:3000/api/cron/sync-bank-transactions 2>&1 | head -5")
print(f"Bank Sync Status: {out[:300]}\n")

# GoCardless status
out = run("curl -sf http://localhost:3000/api/open-banking/gocardless/status 2>&1 | head -5")
print(f"GoCardless Status: {out[:200]}\n")

c.close()
print("Done.")
