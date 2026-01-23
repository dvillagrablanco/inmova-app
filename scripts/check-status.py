#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=30)

print("=== PM2 Status ===")
stdin, stdout, stderr = client.exec_command("pm2 status")
print(stdout.read().decode())

print("=== PM2 Logs (últimas 30 líneas) ===")
stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --nostream --lines 30")
print(stdout.read().decode())
print(stderr.read().decode())

print("=== Health check local ===")
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
print(stdout.read().decode())

client.close()
