#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("157.180.119.236", username="root", password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=30)

print("=" * 60)
print("📋 LOGS DE ERROR")
print("=" * 60)

# PM2 Error logs
stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --err --lines 80 --nostream")
stdout.channel.recv_exit_status()
print(stdout.read().decode()[-4000:])

client.close()
