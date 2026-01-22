#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("157.180.119.236", username="root", password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=30)

print("=" * 60)
print("ESTADO ACTUAL DEL SERVIDOR")
print("=" * 60)

# Check PM2
stdin, stdout, stderr = client.exec_command("pm2 list")
stdout.channel.recv_exit_status()
print("\nPM2 Status:")
print(stdout.read().decode()[:800])

# Check HTTP
stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 --connect-timeout 5")
stdout.channel.recv_exit_status()
print(f"\nHTTP Status: {stdout.read().decode()}")

# Check public URL
stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' https://inmovaapp.com --connect-timeout 5")
stdout.channel.recv_exit_status()
print(f"HTTPS (inmovaapp.com): {stdout.read().decode()}")

client.close()
