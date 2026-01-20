#!/usr/bin/env python3
"""Check PM2 logs and attempt fix"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)

print("=" * 70)
print("📋 PM2 LOGS (últimas líneas de error)")
print("=" * 70)

# Get PM2 error logs
stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --err --lines 50 --nostream")
stdout.channel.recv_exit_status()
out = stdout.read().decode('utf-8', errors='replace')
print(out)

print("\n" + "=" * 70)
print("🔧 INTENTANDO FIX: Restart con configuración directa")
print("=" * 70)

# Try different approaches to start
commands = [
    "pm2 delete all 2>/dev/null || true",
    "cd /opt/inmova-app && pm2 start npm --name inmova-app -- start",
    "sleep 10",
    "pm2 list",
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'No response'",
]

for cmd in commands:
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out[:500])
    if err:
        print(f"STDERR: {err[:200]}")

client.close()
